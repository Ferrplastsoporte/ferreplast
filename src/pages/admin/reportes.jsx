import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminHeader from "./components/AdminHeader";
import logoFerreplast from "../../assets/logo.png";

// =====================================================================
// REPORTES DEL ADMINISTRADOR (archivo autocontenido)
// - Consulta detallada por rango de fechas usando las funciones SQL reporte_*_admin.
// - Gráficos de barras, tabla ordenable con totales.
// - Genera sus propios archivos: CSV (descarga directa) y PDF (con diseño propio,
//   se abre "Guardar como PDF" del navegador; no requiere librerías).
// - KPI relevantes del período elegido (función SQL reporte_resumen_admin),
//   comparados con el período anterior de igual duración.
// - Usa solo las funciones de reportes_admin.sql. No toca el Dashboard.
// =====================================================================


// =====================================================================
// FORMATO Y FECHAS
// =====================================================================


const ZONA_HORARIA = "America/Santiago";

const formatoMoneda = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const formatoNumero = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 1,
});

const formatoCompacto = new Intl.NumberFormat("es-CL", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function hoyISO() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: ZONA_HORARIA });
}

function aISO(fechaUTC) {
  return fechaUTC.toISOString().slice(0, 10);
}

function sumarDias(iso, dias) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return aISO(new Date(Date.UTC(anio, mes - 1, dia + dias)));
}

function rangoPreset(clave) {
  const hoy = hoyISO();
  const [anio, mes] = hoy.split("-").map(Number);

  switch (clave) {
    case "hoy":
      return [hoy, hoy];
    case "7d":
      return [sumarDias(hoy, -6), hoy];
    case "30d":
      return [sumarDias(hoy, -29), hoy];
    case "mes_anterior":
      return [
        aISO(new Date(Date.UTC(anio, mes - 2, 1))),
        aISO(new Date(Date.UTC(anio, mes - 1, 0))),
      ];
    case "anio":
      return [`${anio}-01-01`, hoy];
    case "mes":
    default:
      return [`${hoy.slice(0, 7)}-01`, hoy];
  }
}

function formatearFecha(valor, conHora = false) {
  if (valor === null || valor === undefined || valor === "") return "—";

  // "AAAA-MM-DD" se muestra tal cual (evita el desfase de un día por UTC)
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
    const [anio, mes, dia] = String(valor).split("-");
    return `${dia}-${mes}-${anio}`;
  }

  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);

  return fecha.toLocaleString("es-CL", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// Tipos: texto | moneda | numero | porcentaje | fecha | fechahora | si_no
function formatearValor(tipo, valor) {
  if (valor === null || valor === undefined || valor === "") return "—";

  switch (tipo) {
    case "moneda":
      return formatoMoneda.format(Number(valor));
    case "numero":
      return formatoNumero.format(Number(valor));
    case "porcentaje":
      return `${formatoNumero.format(Number(valor))} %`;
    case "fecha":
      return formatearFecha(valor);
    case "fechahora":
      return formatearFecha(valor, true);
    case "si_no":
      return valor ? "Sí" : "No";
    default:
      return String(valor);
  }
}

// Variación porcentual; null si no hay base de comparación
function variacion(actual, anterior) {
  const a = Number(actual ?? 0);
  const b = Number(anterior ?? 0);
  if (!b) return null;
  return ((a - b) / b) * 100;
}

// Texto "▲ 12 % vs período anterior" (null si no hay base de comparación)
function textoVariacion(valor, anterior, textoComparacion = "vs período anterior") {
  const cambio = variacion(valor, anterior);
  if (cambio === null) return null;
  const flecha = cambio > 0 ? "▲" : cambio < 0 ? "▼" : "=";
  return `${flecha} ${formatoNumero.format(Math.abs(cambio))} % ${textoComparacion}`;
}

function mensajeErrorReporte(error, funcion) {
  if (error?.code === "42501") {
    return "Tu usuario no tiene permisos de administrador para ver esta información.";
  }
  if (error?.code === "PGRST202") {
    return `La función "${funcion}" no existe en Supabase. Ejecuta el archivo supabase/reportes_admin.sql en el SQL Editor.`;
  }
  return error?.message || "No se pudo cargar la información.";
}

// =====================================================================
// GRÁFICOS: DATOS Y GEOMETRÍA
// =====================================================================

// Preparación y geometría de gráficos de reportes.
// JS puro (sin React): lo usan la pantalla (Indicadores.jsx) y el PDF (exportarReportes.js).


const COLOR_BARRA = "#0647b9";
const MAX_BARRAS = 10;

// --------------------------------------------------
// Datos del gráfico a partir de las filas del reporte
// --------------------------------------------------
// Tipos de configuración:
//   serie   -> { x, y }                     columnas en el tiempo (ventas)
//   ranking -> { etiqueta, valor }          top 10 barras horizontales
//   conteo  -> { campo, suma?, vacio? }     agrupa filas por un campo (cuenta o suma)
function prepararGrafico(config, filas = []) {
  const formato = config.formato ?? "numero";

  if (config.tipo === "serie") {
    return {
      ...config,
      formato,
      puntos: filas.map((fila) => ({
        etiqueta: fila[config.x],
        valor: Number(fila[config.y]) || 0,
        cantidad: config.cantidad ? Number(fila[config.cantidad]) || 0 : null,
      })),
    };
  }

  let puntos;

  if (config.tipo === "ranking") {
    puntos = filas
      .map((fila) => ({
        etiqueta: String(fila[config.etiqueta] ?? "—"),
        valor: Number(fila[config.valor]) || 0,
      }))
      .filter((p) => p.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, MAX_BARRAS);
  } else {
    const grupos = new Map();
    for (const fila of filas) {
      const clave = String(fila[config.campo] ?? config.vacio ?? "Sin dato");
      const suma = config.suma ? Number(fila[config.suma]) || 0 : 1;
      grupos.set(clave, (grupos.get(clave) ?? 0) + suma);
    }

    puntos = [...grupos]
      .map(([etiqueta, valor]) => ({ etiqueta, valor }))
      .sort((a, b) => b.valor - a.valor);

    // Más de 10 grupos: se juntan en "Otros" (nunca se inventan colores nuevos)
    if (puntos.length > MAX_BARRAS) {
      const otros = puntos.slice(MAX_BARRAS - 1).reduce((s, p) => s + p.valor, 0);
      puntos = [...puntos.slice(0, MAX_BARRAS - 1), { etiqueta: "Otros", valor: otros }];
    }
  }

  return { ...config, formato, puntos };
}

// --------------------------------------------------
// Utilidades de ejes
// --------------------------------------------------
function maximoRedondo(valor) {
  if (valor <= 0) return 1;
  const magnitud = 10 ** Math.floor(Math.log10(valor));
  const n = valor / magnitud;
  const paso = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return paso * magnitud;
}

function etiquetaEje(valor, formato) {
  return formato === "moneda" ? `$${formatoCompacto.format(valor)}` : formatoCompacto.format(valor);
}

function etiquetaPeriodo(iso, agrupacion = "day") {
  const texto = String(iso ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const [anio, mes, dia] = texto.split("-");
  if (agrupacion === "month") {
    const nombre = new Date(Date.UTC(Number(anio), Number(mes) - 1, 1)).toLocaleDateString("es-CL", {
      month: "short",
      timeZone: "UTC",
    });
    return `${nombre} ${anio.slice(2)}`;
  }
  return `${dia}-${mes}`;
}

// --------------------------------------------------
// Geometría de columnas verticales (serie de tiempo)
// --------------------------------------------------
function geometriaColumnas(puntos, { ancho = 760, alto = 240, agrupacion = "day", formato = "moneda" } = {}) {
  const margen = { arriba: 14, derecha: 8, abajo: 26, izquierda: 62 };
  const anchoUtil = ancho - margen.izquierda - margen.derecha;
  const altoUtil = alto - margen.arriba - margen.abajo;
  const base = margen.arriba + altoUtil;

  const tope = maximoRedondo(Math.max(0, ...puntos.map((p) => p.valor)));
  const paso = anchoUtil / Math.max(puntos.length, 1);
  const anchoBarra = Math.max(Math.min(paso - 2, 32), 1); // 2px de separación entre barras
  const cadaN = Math.max(1, Math.ceil(puntos.length / 10));
  const y = (v) => base - (v / tope) * altoUtil;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: y(tope * f),
    etiqueta: etiquetaEje(tope * f, formato),
    esBase: f === 0,
  }));

  const barras = puntos.map((p, i) => {
    const x = margen.izquierda + i * paso + (paso - anchoBarra) / 2;
    const top = y(p.valor);
    const h = base - top;
    let trazo = "";
    if (h > 0) {
      const r = Math.min(4, anchoBarra / 2, h); // extremo redondeado, base recta
      trazo = `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + anchoBarra - r} Q${
        x + anchoBarra
      },${top} ${x + anchoBarra},${top + r} V${base} Z`;
    }
    return {
      ...p,
      trazo,
      centro: x + anchoBarra / 2,
      zonaX: margen.izquierda + i * paso,
      etiquetaX: i % cadaN === 0 ? etiquetaPeriodo(p.etiqueta, agrupacion) : null,
    };
  });

  return {
    ancho,
    alto,
    margen,
    base,
    paso,
    altoUtil,
    ticks,
    barras,
    sinDatos: puntos.every((p) => p.valor === 0),
  };
}

// --------------------------------------------------
// SVG en texto (para el PDF)
// --------------------------------------------------
const escaparXML = (texto) =>
  String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function svgColumnas(grafico, agrupacion) {
  const g = geometriaColumnas(grafico.puntos, { agrupacion, formato: grafico.formato });

  const lineas = g.ticks
    .map(
      (t) =>
        `<line x1="${g.margen.izquierda}" x2="${g.ancho - g.margen.derecha}" y1="${t.y}" y2="${t.y}" stroke="${
          t.esBase ? "#cbd5e1" : "#eef2f7"
        }" stroke-width="1"/>` +
        `<text x="${g.margen.izquierda - 8}" y="${t.y + 4}" text-anchor="end" font-size="11" fill="#6b7280">${escaparXML(
          t.etiqueta,
        )}</text>`,
    )
    .join("");

  const barras = g.barras
    .map(
      (b) =>
        (b.trazo ? `<path d="${b.trazo}" fill="${COLOR_BARRA}"/>` : "") +
        (b.etiquetaX
          ? `<text x="${b.centro}" y="${g.alto - 8}" text-anchor="middle" font-size="11" fill="#6b7280">${escaparXML(
              b.etiquetaX,
            )}</text>`
          : ""),
    )
    .join("");

  const vacio = g.sinDatos
    ? `<text x="${g.ancho / 2}" y="${g.alto / 2}" text-anchor="middle" font-size="13" fill="#6b7280">Sin datos en el período</text>`
    : "";

  return `<svg viewBox="0 0 ${g.ancho} ${g.alto}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">${lineas}${barras}${vacio}</svg>`;
}

// Barras horizontales (ranking / conteo) como HTML: se imprime nítido y sin cálculos de texto.
function htmlBarras(grafico) {
  if (!grafico.puntos.length) return `<p class="vacio">Sin datos en el período</p>`;

  const maximo = Math.max(...grafico.puntos.map((p) => p.valor), 1);

  return `<div class="barras">${grafico.puntos
    .map(
      (p) => `
      <div class="barra">
        <span class="barra__etiqueta">${escaparXML(p.etiqueta)}</span>
        <span class="barra__pista"><span style="width:${((p.valor / maximo) * 100).toFixed(1)}%"></span></span>
        <span class="barra__valor">${escaparXML(formatearValor(grafico.formato, p.valor))}</span>
      </div>`,
    )
    .join("")}</div>`;
}

// =====================================================================
// EXPORTACIÓN: CSV Y PDF
// =====================================================================

// Exportación de reportes: CSV (Excel) y PDF con diseño propio.
// El PDF se arma como un documento HTML independiente y se envía a imprimir
// en un iframe oculto: el usuario elige "Guardar como PDF". No requiere librerías.


const TIPOS_NUMERICOS = ["moneda", "numero", "porcentaje"];
const SIN_CORTE = /folio|rut|buy_order/; // columnas que no deben partirse en dos líneas

const escaparHTML = (texto) =>
  String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// --------------------------------------------------
// CSV (separador ";" y BOM para que Excel en español lo abra bien)
// --------------------------------------------------
function valorCSV(tipo, valor) {
  if (valor === null || valor === undefined) return "";
  if (["fecha", "fechahora", "si_no"].includes(tipo)) return formatearValor(tipo, valor);
  return valor;
}

function descargarCSV({ titulo, periodo, columnas, filas, totales, nombreArchivo }) {
  const escapar = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;

  const lineas = [
    [`Ferreplast - ${titulo}`, periodo].map(escapar).join(";"),
    columnas.map((col) => escapar(col.t)).join(";"),
    ...filas.map((fila) => columnas.map((col) => escapar(valorCSV(col.tipo, fila[col.c]))).join(";")),
  ];

  if (totales) {
    lineas.push(columnas.map((col, i) => escapar(i === 0 ? "TOTAL" : totales[col.c] ?? "")).join(";"));
  }

  const archivo = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

// --------------------------------------------------
// PDF: documento HTML
// --------------------------------------------------
const ESTILOS_PDF = `
  @page { size: A4 landscape; margin: 12mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; color: #172033; font: 10pt/1.4 "Segoe UI", Arial, Helvetica, sans-serif;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .encabezado { display: flex; align-items: center; justify-content: space-between; gap: 16px;
                padding: 14px 18px; color: #fff; background: #0647b9; border-radius: 10px; }
  .marca { display: flex; align-items: center; gap: 12px; }
  .marca img { height: 34px; background: #fff; border-radius: 6px; padding: 3px; }
  .marca strong { font-size: 16pt; letter-spacing: .04em; }
  .marca span { display: block; font-size: 9pt; opacity: .85; }
  .encabezado__meta { text-align: right; font-size: 9pt; }
  .encabezado__meta b { display: block; font-size: 13pt; }
  .descripcion { margin: 10px 2px 0; color: #4b5563; font-size: 9pt; }
  .filtros { margin: 4px 2px 0; color: #4b5563; font-size: 8.5pt; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
  .kpi { padding: 10px 12px; border: 1px solid #e5e7eb; border-left: 4px solid #0647b9; border-radius: 8px; }
  .kpi p { margin: 0; }
  .kpi__t { color: #6b7280; font-size: 8.5pt; font-weight: 600; }
  .kpi__v { margin-top: 2px !important; font-size: 15pt; font-weight: 800; }
  .kpi__n { color: #4b5563; font-size: 8pt; }
  .kpi__n.bueno { color: #15803d; } .kpi__n.malo { color: #b91c1c; }
  .graficos { display: grid; gap: 10px; margin-top: 12px; }
  .graficos.dos { grid-template-columns: 1fr 1fr; }
  .grafico { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; break-inside: avoid; }
  .grafico h3 { margin: 0 0 8px; font-size: 10pt; }
  .grafico svg { display: block; max-height: 200px; }
  .barras { display: flex; flex-direction: column; gap: 5px; }
  .barra { display: grid; grid-template-columns: 38% 1fr auto; align-items: center; gap: 8px; font-size: 8.5pt; }
  .barra__etiqueta { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .barra__pista { height: 9px; background: #f1f5f9; border-radius: 0 4px 4px 0; }
  .barra__pista span { display: block; height: 100%; background: #0647b9; border-radius: 0 4px 4px 0; }
  .barra__valor { font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .vacio { margin: 0; color: #6b7280; font-size: 9pt; }
  h2 { margin: 14px 2px 6px; font-size: 11pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  thead { display: table-header-group; }
  th { padding: 6px 7px; color: #fff; text-align: left; background: #0647b9; }
  td { padding: 5px 7px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tr { break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .resaltado { color: #b91c1c; font-weight: 700; }
  tr.total td { font-weight: 800; background: #e8eefb !important; border-top: 2px solid #0647b9; }
  .insignia { display: inline-block; padding: 1px 7px; font-size: 7.5pt; font-weight: 700; border-radius: 999px; border: 1px solid; }
  .insignia.ok { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
  .insignia.alta { color: #991b1b; background: #fef2f2; border-color: #fecaca; }
  .insignia.media { color: #92400e; background: #fffbeb; border-color: #fde68a; }
  .insignia.baja { color: #334155; background: #f1f5f9; border-color: #e2e8f0; }
  .sin-corte { white-space: nowrap; }
  .pie { margin-top: 10px; color: #6b7280; font-size: 7.5pt; }
`;

function generarHTMLReporte({
  titulo,
  descripcion = "",
  periodo,
  filtros = [],
  kpis = [],
  graficos = [],
  agrupacion = "day",
  columnas,
  filas,
  totales = null,
  logoUrl = "",
  nombreDocumento = "Reporte Ferreplast",
}) {
  const generado = formatearFecha(new Date().toISOString(), true);

  const htmlKpis = kpis.length
    ? `<section class="kpis">${kpis
        .map(
          (k) => `<div class="kpi">
            <p class="kpi__t">${escaparHTML(k.titulo)}</p>
            <p class="kpi__v">${escaparHTML(k.valor)}</p>
            ${k.nota ? `<p class="kpi__n ${k.clase ?? ""}">${escaparHTML(k.nota)}</p>` : ""}
          </div>`,
        )
        .join("")}</section>`
    : "";

  const htmlGraficos = graficos.length
    ? `<section class="graficos ${graficos.length > 1 ? "dos" : ""}">${graficos
        .map(
          (g) => `<div class="grafico">
            <h3>${escaparHTML(g.titulo)}</h3>
            ${g.tipo === "serie" ? svgColumnas(g, agrupacion) : htmlBarras(g)}
          </div>`,
        )
        .join("")}</section>`
    : "";

  const encabezados = columnas
    .map((col) => `<th class="${TIPOS_NUMERICOS.includes(col.tipo) ? "num" : ""}">${escaparHTML(col.t)}</th>`)
    .join("");

  const cuerpo = filas.length
    ? filas
        .map(
          (fila) =>
            `<tr>${columnas
              .map((col) => {
                const valor = fila[col.c];
                const clases = [
                  TIPOS_NUMERICOS.includes(col.tipo) ? "num" : "",
                  SIN_CORTE.test(col.c) || ["fecha", "fechahora"].includes(col.tipo) ? "sin-corte" : "",
                  col.resaltar?.(valor) ? "resaltado" : "",
                ].join(" ");
                const contenido = col.nivel
                  ? `<span class="insignia ${escaparHTML(col.nivel(fila))}">${escaparHTML(valor ?? col.vacio ?? "—")}</span>`
                  : escaparHTML(formatearValor(col.tipo, valor));
                return `<td class="${clases}">${contenido}</td>`;
              })
              .join("")}</tr>`,
        )
        .join("")
    : `<tr><td colspan="${columnas.length}" style="padding:18px;text-align:center;color:#6b7280">No hay resultados para este período.</td></tr>`;

  const filaTotal =
    totales && filas.length
      ? `<tr class="total">${columnas
          .map(
            (col, i) =>
              `<td class="${col.total ? "num" : ""}">${
                i === 0 ? "Total" : col.total ? escaparHTML(formatearValor(col.tipo, totales[col.c])) : ""
              }</td>`,
          )
          .join("")}</tr>`
      : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escaparHTML(nombreDocumento)}</title>
<style>${ESTILOS_PDF}</style>
</head>
<body>
  <header class="encabezado">
    <div class="marca">
      ${logoUrl ? `<img src="${escaparHTML(logoUrl)}" alt="">` : ""}
      <div><strong>FERREPLAST</strong><span>Panel de administración · Reportes</span></div>
    </div>
    <div class="encabezado__meta"><b>${escaparHTML(titulo)}</b>${escaparHTML(periodo)}<br>Generado el ${escaparHTML(generado)}</div>
  </header>
  ${descripcion ? `<p class="descripcion">${escaparHTML(descripcion)}</p>` : ""}
  ${filtros.length ? `<p class="filtros"><b>Filtros:</b> ${escaparHTML(filtros.join(" · "))}</p>` : ""}
  ${htmlKpis}
  ${htmlGraficos}
  <h2>Detalle (${filas.length} ${filas.length === 1 ? "registro" : "registros"})</h2>
  <table>
    <thead><tr>${encabezados}</tr></thead>
    <tbody>${cuerpo}${filaTotal}</tbody>
  </table>
  <p class="pie">Ferreplast SpA · Documento de uso interno</p>
</body>
</html>`;
}

// --------------------------------------------------
// PDF: imprimir el documento en un iframe oculto
// --------------------------------------------------
function imprimirPDF(opciones) {
  const html = generarHTMLReporte(opciones);

  const marco = document.createElement("iframe");
  marco.setAttribute("aria-hidden", "true");
  marco.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(marco);

  const documento = marco.contentDocument;
  documento.open();
  documento.write(html);
  documento.close();

  const limpiar = () => setTimeout(() => marco.remove(), 1000);

  const imprimir = () => {
    marco.contentWindow.addEventListener("afterprint", limpiar, { once: true });
    marco.contentWindow.focus();
    marco.contentWindow.print();
    setTimeout(() => marco.isConnected && marco.remove(), 120000); // respaldo
  };

  // Espera a que cargue el logo (si hay) antes de imprimir
  const imagenes = [...documento.images].filter((img) => !img.complete);
  if (!imagenes.length) {
    setTimeout(imprimir, 50);
  } else {
    let pendientes = imagenes.length;
    const listo = () => {
      pendientes -= 1;
      if (pendientes === 0) imprimir();
    };
    imagenes.forEach((img) => {
      img.addEventListener("load", listo, { once: true });
      img.addEventListener("error", listo, { once: true });
    });
  }
}

// =====================================================================
// COMPONENTES VISUALES
// =====================================================================


// ==================================================
// TARJETA KPI (valor + comparación con el período anterior)
// ==================================================

function TarjetaKpi({
  titulo,
  valor,
  anterior,
  tipo = "numero",
  menosEsMejor = false,
  detalle,
  textoComparacion = "vs período anterior",
}) {
  const cambio = anterior === undefined ? null : variacion(valor, anterior);
  const esBueno = cambio === null || cambio === 0 ? null : cambio > 0 !== menosEsMejor;

  return (
    <article className="ind-kpi">
      <p className="ind-kpi__titulo">{titulo}</p>
      <p className="ind-kpi__valor">{formatearValor(tipo, valor ?? 0)}</p>

      {anterior !== undefined && (
        <p className={`ind-kpi__cambio ${esBueno === null ? "" : esBueno ? "es-bueno" : "es-malo"}`}>
          {cambio === null
            ? `Antes: ${formatearValor(tipo, anterior ?? 0)}`
            : textoVariacion(valor, anterior, textoComparacion)}
        </p>
      )}

      {detalle && <p className="ind-kpi__detalle">{detalle}</p>}
    </article>
  );
}

// ==================================================
// GRÁFICO DE COLUMNAS (serie de tiempo) con tooltip
// ==================================================

function GraficoColumnas({ puntos = [], agrupacion = "day", formato = "moneda", unidad = "pedido" }) {
  const [activo, setActivo] = useState(null);
  const g = geometriaColumnas(puntos, { agrupacion, formato });
  const barraActiva = activo === null ? null : g.barras[activo];

  return (
    <div className="ind-grafico">
      <svg
        viewBox={`0 0 ${g.ancho} ${g.alto}`}
        role="img"
        aria-label="Gráfico de columnas por período"
        onMouseLeave={() => setActivo(null)}
      >
        {g.ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={g.margen.izquierda}
              x2={g.ancho - g.margen.derecha}
              y1={t.y}
              y2={t.y}
              className={t.esBase ? "ind-grafico__base" : "ind-grafico__grilla"}
            />
            <text x={g.margen.izquierda - 8} y={t.y + 4} textAnchor="end" className="ind-grafico__eje">
              {t.etiqueta}
            </text>
          </g>
        ))}

        {g.barras.map((b, i) => (
          <g key={`${b.etiqueta}-${i}`}>
            {b.trazo && (
              <path d={b.trazo} className={`ind-grafico__barra ${activo === i ? "es-activa" : ""}`} />
            )}
            {b.etiquetaX && (
              <text x={b.centro} y={g.alto - 8} textAnchor="middle" className="ind-grafico__eje">
                {b.etiquetaX}
              </text>
            )}
            <rect
              x={b.zonaX}
              y={g.margen.arriba}
              width={g.paso}
              height={g.altoUtil}
              fill="transparent"
              onMouseEnter={() => setActivo(i)}
            />
          </g>
        ))}
      </svg>

      {g.sinDatos && <p className="ind-grafico__vacio">Sin datos en el período</p>}

      {barraActiva && (
        <div className="ind-grafico__tooltip" style={{ left: `${(barraActiva.centro / g.ancho) * 100}%` }}>
          <strong>{formatearFecha(barraActiva.etiqueta)}</strong>
          <span>{formatearValor(formato, barraActiva.valor)}</span>
          {barraActiva.cantidad !== null && barraActiva.cantidad !== undefined && (
            <span>
              {barraActiva.cantidad} {Number(barraActiva.cantidad) === 1 ? unidad : `${unidad}s`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ==================================================
// BARRAS HORIZONTALES (ranking / conteo), con valor rotulado
// ==================================================

function GraficoBarras({ puntos = [], formato = "numero" }) {
  if (!puntos.length) return <p className="ind-vacio">Sin datos en el período.</p>;

  const maximo = Math.max(...puntos.map((p) => p.valor), 1);

  return (
    <ul className="ind-barras">
      {puntos.map((p) => (
        <li key={p.etiqueta} title={`${p.etiqueta}: ${formatearValor(formato, p.valor)}`}>
          <span className="ind-barras__etiqueta">{p.etiqueta}</span>
          <span className="ind-barras__pista">
            <span style={{ width: `${(p.valor / maximo) * 100}%` }} />
          </span>
          <strong className="ind-barras__valor">{formatearValor(formato, p.valor)}</strong>
        </li>
      ))}
    </ul>
  );
}

// Elige el gráfico según la configuración preparada con prepararGrafico()
function Grafico({ grafico, agrupacion }) {
  return (
    <section className="ind-panel">
      <h3>{grafico.titulo}</h3>
      {grafico.tipo === "serie" ? (
        <GraficoColumnas puntos={grafico.puntos} agrupacion={agrupacion} formato={grafico.formato} />
      ) : (
        <GraficoBarras puntos={grafico.puntos} formato={grafico.formato} />
      )}
    </section>
  );
}

// =====================================================================
// ESTILOS DE LA PÁGINA
// =====================================================================

const ESTILOS = `
  .reportes { --ind-azul: #0647b9; --ind-azul-suave: #dbe7fb; --ind-texto: #172033; --ind-texto-sec: #4b5563; --ind-texto-tenue: #6b7280; --ind-borde: #e5e7eb; --ind-fondo: #ffffff; --ind-bueno: #15803d; --ind-malo: #b91c1c; }
  .ind-kpi { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 18px 20px; background: var(--ind-fondo); border: 1px solid var(--ind-borde); border-radius: 14px; }
  .ind-kpi p { margin: 0; }
  .ind-kpi__titulo { color: var(--ind-texto-tenue); font-size: 0.85rem; font-weight: 600; }
  .ind-kpi__valor { color: var(--ind-texto); font-size: clamp(1.3rem, 2vw, 1.7rem); font-weight: 800; line-height: 1.15; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
  .ind-kpi__cambio { color: var(--ind-texto-tenue); font-size: 0.8rem; font-weight: 600; }
  .ind-kpi__cambio.es-bueno { color: var(--ind-bueno); }
  .ind-kpi__cambio.es-malo { color: var(--ind-malo); }
  .ind-kpi__detalle { color: var(--ind-texto-sec); font-size: 0.8rem; }
  .ind-panel { min-width: 0; padding: 18px 20px; background: var(--ind-fondo); border: 1px solid var(--ind-borde); border-radius: 14px; }
  .ind-panel h3 { margin: 0 0 14px; color: var(--ind-texto); font-size: 1rem; font-weight: 700; }
  .ind-vacio { margin: 0; color: var(--ind-texto-tenue); font-size: 0.9rem; }
  .ind-barras { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0; list-style: none; }
  .ind-barras li { display: grid; grid-template-columns: minmax(90px, 38%) minmax(0, 1fr) auto; align-items: center; gap: 10px; font-size: 0.86rem; }
  .ind-barras__etiqueta { overflow: hidden; color: var(--ind-texto-sec); text-overflow: ellipsis; white-space: nowrap; }
  .ind-barras__pista { height: 10px; background: #f1f5f9; border-radius: 0 4px 4px 0; }
  .ind-barras__pista span { display: block; height: 100%; min-width: 2px; background: var(--ind-azul); border-radius: 0 4px 4px 0; }
  .ind-barras li:hover .ind-barras__pista span { background: #05399a; }
  .ind-barras__valor { color: var(--ind-texto); white-space: nowrap; font-variant-numeric: tabular-nums; }
  .ind-grafico { position: relative; }
  .ind-grafico svg { display: block; width: 100%; height: auto; }
  .ind-grafico__barra { fill: var(--ind-azul); transition: opacity 0.15s ease; }
  .ind-grafico svg:hover .ind-grafico__barra:not(.es-activa) { opacity: 0.55; }
  .ind-grafico__grilla { stroke: #eef2f7; stroke-width: 1; }
  .ind-grafico__base { stroke: #cbd5e1; stroke-width: 1; }
  .ind-grafico__eje { fill: var(--ind-texto-tenue); font-size: 11px; }
  .ind-grafico__vacio { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; color: var(--ind-texto-tenue); font-size: 0.9rem; pointer-events: none; }
  .ind-grafico__tooltip { position: absolute; top: 0; z-index: 2; display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; color: var(--ind-texto); font-size: 0.8rem; white-space: nowrap; background: #ffffff; border: 1px solid var(--ind-borde); border-radius: 8px; box-shadow: 0 6px 18px rgb(15 23 42 / 12%); transform: translateX(-50%); pointer-events: none; }
  .ind-grafico__tooltip span { color: var(--ind-texto-sec); }
  .esta-actualizando { opacity: 0.55; transition: opacity 0.2s ease; }
  .reportes { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
  .reportes-filtros { display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; }
  .reportes-presets { display: flex; flex-wrap: wrap; gap: 8px; }
  .reportes-presets button { padding: 6px 12px; color: #374151; font-size: 0.85rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 999px; cursor: pointer; }
  .reportes-presets button:hover { background: #eef2f7; }
  .reportes-presets button.es-activo { color: #ffffff; background: #0647b9; border-color: #0647b9; }
  .reportes-filtros__campos { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 12px; }
  .reportes-filtros__campos label { display: flex; flex-direction: column; gap: 6px; min-width: 160px; color: #374151; font-size: 0.85rem; font-weight: 600; }
  .reportes-filtros__busqueda { flex: 1 1 220px; }
  .reportes-filtros__campos input, .reportes-filtros__campos select { height: 40px; padding: 0 10px; color: #172033; font: inherit; font-weight: 400; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; }
  .reportes-filtros__campos input:focus, .reportes-filtros__campos select:focus { outline: 2px solid #93b4ee; outline-offset: 1px; }
  .reportes-boton-principal { height: 40px; padding: 0 18px; color: #ffffff; font-weight: 700; background: #0647b9; border: none; border-radius: 8px; cursor: pointer; }
  .reportes-boton-principal:hover { background: #05399a; }
  .reportes-boton-principal:disabled { opacity: 0.5; cursor: not-allowed; }
  .reportes-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .reportes-pestanas { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid #e5e7eb; }
  .reportes-pestanas button { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; color: #4b5563; font-size: 0.9rem; font-weight: 600; white-space: nowrap; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; }
  .reportes-pestanas button:hover { color: #0647b9; }
  .reportes-pestanas button.es-activa { color: #0647b9; border-bottom-color: #0647b9; }
  .reportes-pestanas__contador { min-width: 20px; padding: 1px 6px; color: #ffffff; font-size: 0.72rem; text-align: center; background: #b91c1c; border-radius: 999px; }
  .reportes-contenido { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .reportes-encabezado h2 { margin: 0 0 4px; color: #172033; font-size: 1.2rem; }
  .reportes-encabezado p { margin: 0; color: #6b7280; font-size: 0.88rem; }
  .reportes-error { padding: 12px 14px; color: #991b1b; font-size: 0.9rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; }
  .reportes-cargando { margin: 0; padding: 30px; color: #6b7280; text-align: center; }
  .reportes-graficos { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .reportes-graficos.es-doble { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .reportes-tabla-contenedor { min-width: 0; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
  .reportes-tabla-barra { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
  .reportes-tabla-barra input { flex: 0 1 260px; height: 36px; padding: 0 10px; font: inherit; border: 1px solid #cbd5e1; border-radius: 8px; }
  .reportes-tabla-barra > span { color: #6b7280; font-size: 0.85rem; }
  .reportes-tabla-acciones { display: flex; gap: 8px; margin-left: auto; }
  .reportes-tabla-acciones button { height: 36px; padding: 0 12px; color: #172033; font-size: 0.85rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer; }
  .reportes-tabla-acciones button:hover { background: #f8fafc; }
  .reportes-tabla-acciones button.es-principal { color: #ffffff; background: #0647b9; border-color: #0647b9; }
  .reportes-tabla-acciones button.es-principal:hover { background: #05399a; }
  .reportes-tabla-acciones button:disabled { opacity: 0.5; cursor: not-allowed; }
  .reportes-tabla-scroll { width: 100%; max-height: 70vh; overflow: auto; }
  .reportes-tabla { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
  .reportes-tabla th { position: sticky; top: 0; z-index: 1; padding: 0; text-align: left; background: #f8fafc; border-bottom: 1px solid #e5e7eb; }
  .reportes-tabla th button { width: 100%; padding: 10px 14px; color: #475569; font: inherit; font-weight: 700; text-align: inherit; white-space: nowrap; background: none; border: none; cursor: pointer; }
  .reportes-tabla th button:hover { color: #0647b9; }
  .reportes-tabla td { padding: 9px 14px; color: #1f2937; white-space: nowrap; border-bottom: 1px solid #f1f5f9; }
  .reportes-tabla tbody tr:hover td { background: #f8fafc; }
  .reportes-tabla .es-numero { text-align: right; font-variant-numeric: tabular-nums; }
  .reportes-tabla td.es-largo { min-width: 260px; white-space: normal; }
  .reportes-tabla td.es-resaltado { color: #b91c1c; font-weight: 700; }
  .reportes-tabla tfoot td { position: sticky; bottom: 0; font-weight: 800; background: #f1f5f9; border-top: 2px solid #e2e8f0; }
  .reportes-tabla__vacio { padding: 36px !important; color: #6b7280 !important; text-align: center; }
  .reportes-celda-barra { position: relative; display: inline-flex; align-items: center; justify-content: flex-end; min-width: 120px; gap: 8px; }
  .reportes-celda-barra > span { height: 6px; max-width: 60px; background: #0647b9; border-radius: 999px; }
  .reportes-insignia { display: inline-block; padding: 3px 9px; font-size: 0.78rem; font-weight: 700; text-transform: capitalize; border: 1px solid transparent; border-radius: 999px; }
  .reportes-insignia--ok { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
  .reportes-insignia--alta { color: #991b1b; background: #fef2f2; border-color: #fecaca; }
  .reportes-insignia--media { color: #92400e; background: #fffbeb; border-color: #fde68a; }
  .reportes-insignia--baja { color: #334155; background: #f1f5f9; border-color: #e2e8f0; }
  @media (max-width: 1100px) { .reportes-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .reportes-graficos.es-doble { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 600px) { .reportes-kpis { grid-template-columns: 1fr; } .reportes-filtros__campos label, .reportes-boton-principal { flex: 1 1 100%; } .reportes-tabla-acciones { margin-left: 0; } }
`;

// =====================================================================
// PÁGINA DE REPORTES
// =====================================================================

// REPORTES = KPI del período + consulta detallada por rango de fechas: gráficos, tabla, CSV y PDF.

// ==================================================
// CONFIGURACIÓN
// ==================================================

const PRESETS_FECHA = [
  ["hoy", "Hoy"],
  ["7d", "Últimos 7 días"],
  ["30d", "Últimos 30 días"],
  ["mes", "Este mes"],
  ["mes_anterior", "Mes anterior"],
  ["anio", "Este año"],
];

const FILTROS_INICIALES = {
  estadoPedido: "",
  tipoDespacho: "",
  estadoCotizacion: "",
  estadoPago: "",
  metodoPago: "",
  agrupacion: "day",
  agrupacionCategoria: "familia",
  limite: "20",
};

const CATALOGOS_VACIOS = {
  estados_pedido: [],
  estados_cotizacion: [],
  estados_pago: [],
  metodos_pago: [],
  tipos_despacho: [],
};

const NOMBRE_AGRUPACION = { day: "día", week: "semana", month: "mes" };

const NIVEL_SITUACION = {
  "Stock negativo": "alta",
  "Activo sin stock": "media",
  "Stock bajo": "media",
  "Sin ventas en el período": "baja",
  OK: "ok",
};


const numeroONulo = (valor) => (valor === "" ? null : Number(valor));

// Cada reporte: función RPC, parámetros extra, filtros visibles, gráficos y columnas.
// Columna: { c: campo, t: título, tipo, total, nivel(fila) => insignia, resaltar(valor), barra, largo }
// Gráfico: serie {x, y} | ranking {etiqueta, valor} | conteo {campo, suma?}
const REPORTES = {
  ventas: {
    titulo: "Ventas",
    descripcion: "Pedidos con pago autorizado, por fecha de pago. Los períodos sin ventas aparecen en cero.",
    funcion: "reporte_ventas_admin",
    filtros: ["agrupacion"],
    parametros: (f) => ({ p_agrupar: f.agrupacion }),
    graficos: (f) => [
      {
        tipo: "serie",
        titulo: `Total vendido por ${NOMBRE_AGRUPACION[f.agrupacion]}`,
        x: "periodo",
        y: "total_vendido",
        cantidad: "cant_pedidos",
        formato: "moneda",
      },
    ],
    columnas: [
      { c: "periodo", t: "Período", tipo: "fecha" },
      { c: "cant_pedidos", t: "Pedidos", tipo: "numero", total: true },
      { c: "unidades", t: "Unidades", tipo: "numero", total: true },
      { c: "clientes", t: "Clientes", tipo: "numero" },
      { c: "boletas", t: "Boletas", tipo: "numero", total: true },
      { c: "facturas", t: "Facturas", tipo: "numero", total: true },
      { c: "total_vendido", t: "Total vendido", tipo: "moneda", total: true },
      { c: "ticket_promedio", t: "Ticket promedio", tipo: "moneda" },
    ],
  },

  productos: {
    titulo: "Productos más vendidos",
    descripcion: "Ranking por monto vendido, con el stock actual de cada producto.",
    funcion: "reporte_top_productos_admin",
    filtros: ["limite"],
    parametros: (f) => ({ p_limite: Number(f.limite) }),
    graficos: () => [
      { tipo: "ranking", titulo: "Top 10 por monto vendido", etiqueta: "producto", valor: "monto", formato: "moneda" },
      { tipo: "ranking", titulo: "Top 10 por unidades vendidas", etiqueta: "producto", valor: "unidades" },
    ],
    columnas: [
      { c: "producto", t: "Producto" },
      { c: "familia", t: "Familia" },
      { c: "marca", t: "Marca" },
      { c: "unidades", t: "Unidades", tipo: "numero", total: true },
      { c: "pedidos", t: "Pedidos", tipo: "numero" },
      { c: "monto", t: "Monto vendido", tipo: "moneda", total: true },
      { c: "participacion", t: "Participación", tipo: "porcentaje", barra: true },
      { c: "precio_promedio", t: "Precio promedio", tipo: "moneda" },
      { c: "stock_actual", t: "Stock actual", tipo: "numero" },
    ],
  },

  categorias: {
    titulo: "Categorías y marcas",
    descripcion: "Qué familias, subcategorías o marcas generan las ventas.",
    funcion: "reporte_categorias_admin",
    filtros: ["agrupacionCategoria"],
    parametros: (f) => ({ p_agrupar: f.agrupacionCategoria }),
    graficos: () => [
      { tipo: "ranking", titulo: "Monto vendido por grupo", etiqueta: "grupo", valor: "monto", formato: "moneda" },
    ],
    columnas: [
      { c: "grupo", t: "Grupo" },
      { c: "productos", t: "Productos distintos", tipo: "numero" },
      { c: "unidades", t: "Unidades", tipo: "numero", total: true },
      { c: "pedidos", t: "Pedidos", tipo: "numero" },
      { c: "monto", t: "Monto vendido", tipo: "moneda", total: true },
      { c: "participacion", t: "Participación", tipo: "porcentaje", barra: true },
    ],
  },

  clientes: {
    titulo: "Clientes",
    descripcion: "Clientes que compraron, cotizaron o se registraron en el período.",
    funcion: "reporte_clientes_admin",
    parametros: () => ({}),
    graficos: () => [
      { tipo: "ranking", titulo: "Top 10 clientes por monto comprado", etiqueta: "cliente", valor: "total_comprado", formato: "moneda" },
    ],
    columnas: [
      { c: "cliente", t: "Cliente" },
      { c: "rut", t: "RUT" },
      { c: "comuna", t: "Comuna" },
      { c: "pedidos", t: "Pedidos pagados", tipo: "numero", total: true },
      { c: "total_comprado", t: "Total comprado", tipo: "moneda", total: true },
      { c: "ticket_promedio", t: "Ticket promedio", tipo: "moneda" },
      { c: "ultima_compra", t: "Última compra", tipo: "fechahora" },
      { c: "cotizaciones", t: "Cotizaciones", tipo: "numero", total: true },
      { c: "cliente_nuevo", t: "Nuevo", tipo: "si_no" },
    ],
  },

  pedidos: {
    titulo: "Pedidos",
    descripcion: "Todos los pedidos creados, con su pago (el autorizado o el último intento) y bodeguero.",
    funcion: "reporte_pedidos_admin",
    filtros: ["estadoPedido", "tipoDespacho", "busqueda"],
    parametros: (f, busqueda) => ({
      p_id_estado: numeroONulo(f.estadoPedido),
      p_id_tipo_despacho: numeroONulo(f.tipoDespacho),
      p_folio: busqueda || null,
    }),
    graficos: () => [
      { tipo: "conteo", titulo: "Pedidos por estado", campo: "estado" },
      { tipo: "conteo", titulo: "Pedidos por tipo de despacho", campo: "tipo_despacho", vacio: "Sin tipo" },
    ],
    columnas: [
      { c: "folio_pedido", t: "Folio pedido" },
      { c: "fecha", t: "Fecha", tipo: "fechahora" },
      { c: "cliente", t: "Cliente" },
      { c: "rut_cliente", t: "RUT" },
      { c: "estado", t: "Estado" },
      {
        c: "estado_pago",
        t: "Pago",
        nivel: (f) => (f.pagado ? "ok" : f.estado_pago ? "media" : "baja"),
        vacio: "Sin pago",
      },
      { c: "metodo_pago", t: "Método de pago" },
      { c: "tipo_despacho", t: "Tipo de despacho" },
      { c: "tipo_documento", t: "Documento" },
      { c: "unidades", t: "Unidades", tipo: "numero", total: true },
      { c: "total", t: "Total", tipo: "moneda", total: true },
      { c: "bodeguero", t: "Bodeguero" },
      { c: "registrado_erp", t: "En ERP", tipo: "si_no" },
    ],
  },

  pagos: {
    titulo: "Pagos",
    descripcion: "Todos los intentos de pago: autorizados, rechazados y pendientes.",
    funcion: "reporte_pagos_admin",
    filtros: ["estadoPago", "metodoPago", "busqueda"],
    parametros: (f, busqueda) => ({
      p_folio: busqueda || null,
      p_id_estado_pago: numeroONulo(f.estadoPago),
      p_id_metodo: numeroONulo(f.metodoPago),
    }),
    graficos: () => [
      { tipo: "conteo", titulo: "Monto por estado de pago", campo: "estado_pago", suma: "monto", formato: "moneda" },
      { tipo: "conteo", titulo: "Monto por método de pago", campo: "metodo_pago", suma: "monto", formato: "moneda" },
    ],
    columnas: [
      { c: "folio_pago", t: "Folio pago" },
      { c: "folio_pedido", t: "Folio pedido" },
      { c: "fecha_pago", t: "Fecha", tipo: "fechahora" },
      { c: "cliente", t: "Cliente" },
      { c: "metodo_pago", t: "Método" },
      {
        c: "estado_pago",
        t: "Estado",
        nivel: (f) =>
          f.codigo_estado === "AUTORIZADO"
            ? "ok"
            : ["RECHAZADO", "ANULADO", "ERROR_CONFIRMACION"].includes(f.codigo_estado)
              ? "alta"
              : "media",
      },
      { c: "monto", t: "Monto", tipo: "moneda", total: true },
      { c: "total_pedido", t: "Total pedido", tipo: "moneda" },
      { c: "diferencia", t: "Diferencia", tipo: "moneda", resaltar: (v) => Number(v) !== 0 },
      { c: "referencia_externa", t: "Referencia" },
    ],
  },

  cotizaciones: {
    titulo: "Cotizaciones",
    descripcion: "Solicitudes de cotización, su estado, validez y montos.",
    funcion: "reporte_cotizaciones_admin",
    filtros: ["estadoCotizacion", "busqueda"],
    parametros: (f, busqueda) => ({
      p_id_estado: numeroONulo(f.estadoCotizacion),
      p_folio: busqueda || null,
    }),
    graficos: () => [
      { tipo: "conteo", titulo: "Cotizaciones por estado", campo: "estado" },
      { tipo: "conteo", titulo: "Cotizaciones por medio de contacto", campo: "medio_contacto" },
    ],
    columnas: [
      { c: "folio", t: "Folio" },
      { c: "fecha_solicitud", t: "Fecha", tipo: "fechahora" },
      { c: "cliente", t: "Cliente" },
      { c: "estado", t: "Estado" },
      { c: "medio_contacto", t: "Medio de contacto" },
      { c: "fecha_emision", t: "Emitida", tipo: "fecha" },
      { c: "fecha_validez", t: "Válida hasta", tipo: "fecha" },
      { c: "vencida", t: "Vencida", tipo: "si_no", resaltar: (v) => v === true },
      { c: "cant_productos", t: "Ítems", tipo: "numero" },
      { c: "fuera_catalogo", t: "Fuera de catálogo", tipo: "numero" },
      { c: "subtotal_neto", t: "Neto", tipo: "moneda", total: true },
      { c: "monto_iva", t: "IVA", tipo: "moneda", total: true },
      { c: "total_bruto", t: "Total", tipo: "moneda", total: true },
    ],
  },

  inventario: {
    titulo: "Inventario",
    descripcion: "Stock actual valorizado y rotación en el período. Los problemas aparecen primero.",
    funcion: "reporte_inventario_admin",
    parametros: () => ({}),
    graficos: () => [
      { tipo: "conteo", titulo: "Productos por situación", campo: "situacion" },
      { tipo: "ranking", titulo: "Top 10 por valor de stock", etiqueta: "producto", valor: "valor_stock", formato: "moneda" },
    ],
    columnas: [
      { c: "situacion", t: "Situación", nivel: (f) => NIVEL_SITUACION[f.situacion] ?? "baja" },
      { c: "producto", t: "Producto" },
      { c: "familia", t: "Familia" },
      { c: "marca", t: "Marca" },
      { c: "estado", t: "Estado" },
      { c: "stock", t: "Stock", tipo: "numero" },
      { c: "unidad", t: "Unidad" },
      { c: "precio", t: "Precio", tipo: "moneda" },
      { c: "valor_stock", t: "Valor del stock", tipo: "moneda", total: true },
      { c: "vendidas_periodo", t: "Vendidas en el período", tipo: "numero", total: true },
      { c: "ultima_venta", t: "Última venta", tipo: "fecha" },
    ],
  },

  alertas: {
    titulo: "Alertas",
    descripcion:
      "Lo que no se debe pasar por alto: cobros duplicados, montos que no cuadran, facturas sin datos, pagos colgados, stock negativo, etc.",
    funcion: "reporte_alertas_admin",
    parametros: () => ({}),
    graficos: () => [
      { tipo: "conteo", titulo: "Alertas por prioridad", campo: "severidad" },
      { tipo: "conteo", titulo: "Alertas por tipo", campo: "tipo" },
    ],
    columnas: [
      { c: "severidad", t: "Prioridad", nivel: (f) => f.severidad },
      { c: "tipo", t: "Tipo" },
      { c: "referencia", t: "Referencia" },
      { c: "fecha", t: "Fecha", tipo: "fechahora" },
      { c: "detalle", t: "Detalle", largo: true },
      { c: "monto", t: "Monto", tipo: "moneda" },
    ],
  },
};

// ==================================================
// CONSULTAS
// ==================================================

async function consultarReporte({ tipo, desde, hasta, filtros, busqueda }) {
  const reporte = REPORTES[tipo];

  try {
    const { data, error } = await supabase.rpc(reporte.funcion, {
      p_desde: desde,
      p_hasta: hasta,
      ...reporte.parametros(filtros, busqueda),
    });

    if (error) return { error: mensajeErrorReporte(error, reporte.funcion) };
    return { datos: Array.isArray(data) ? data : data ? [data] : [] };
  } catch (error) {
    return { error: mensajeErrorReporte(error, reporte.funcion) };
  }
}

async function consultarKpis(desde, hasta) {
  const [resumen, alertas] = await Promise.all([
    supabase.rpc("reporte_resumen_admin", { p_desde: desde, p_hasta: hasta }),
    supabase.rpc("reporte_alertas_admin", { p_desde: desde, p_hasta: hasta }),
  ]);

  return {
    resumen: resumen.error ? null : resumen.data,
    alertas: alertas.error ? null : (alertas.data ?? []).length,
  };
}

// KPI clave del período: los mismos en pantalla y en el PDF
function kpisDelPeriodo(resumen) {
  const a = resumen?.actual;
  const b = resumen?.anterior;
  if (!a) return [];

  const tasaExito = a.cotizaciones ? (a.cotizaciones_exitosas / a.cotizaciones) * 100 : null;

  return [
    { titulo: "Total vendido", tipo: "moneda", valor: a.total_vendido, anterior: b?.total_vendido },
    {
      titulo: "Pedidos pagados",
      tipo: "numero",
      valor: a.pedidos_pagados,
      anterior: b?.pedidos_pagados,
      detalle: `${a.pedidos_creados ?? 0} pedidos creados en el período`,
    },
    { titulo: "Ticket promedio", tipo: "moneda", valor: a.ticket_promedio, anterior: b?.ticket_promedio },
    {
      titulo: "Clientes que compraron",
      tipo: "numero",
      valor: a.clientes_compradores,
      anterior: b?.clientes_compradores,
      detalle: `${a.clientes_nuevos ?? 0} clientes nuevos registrados`,
    },
    {
      titulo: "Cotizaciones exitosas",
      tipo: "numero",
      valor: a.cotizaciones_exitosas,
      anterior: b?.cotizaciones_exitosas,
      detalle: `${tasaExito === null ? "—" : `${formatoNumero.format(tasaExito)} %`} de ${a.cotizaciones ?? 0} solicitadas · ${formatoMoneda.format(Number(a.monto_cot_exitosas) || 0)}`,
    },
    {
      titulo: "Pagos fallidos",
      tipo: "numero",
      valor: a.pagos_fallidos,
      anterior: b?.pagos_fallidos,
      menosEsMejor: true,
      detalle: "Rechazados, anulados o con error",
    },
  ];
}

// ==================================================
// TABLA (filtro local, orden, totales y exportación)
// ==================================================

function compararValores(a, b) {
  const numA = Number(a);
  const numB = Number(b);
  if (a !== "" && b !== "" && !Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
  return String(a).localeCompare(String(b), "es");
}

function TablaReporte({ reporte, datos, actualizando, alExportar }) {
  const [texto, setTexto] = useState("");
  const [orden, setOrden] = useState({ campo: null, asc: true });
  const { columnas } = reporte;

  const filas = useMemo(() => {
    const termino = texto.trim().toLowerCase();
    const filtradas = termino
      ? datos.filter((fila) =>
          columnas.some((col) => formatearValor(col.tipo, fila[col.c]).toLowerCase().includes(termino)),
        )
      : datos;

    if (!orden.campo) return filtradas;

    return [...filtradas].sort((x, y) => {
      const a = x[orden.campo];
      const b = y[orden.campo];
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      return orden.asc ? compararValores(a, b) : -compararValores(a, b);
    });
  }, [datos, texto, orden, columnas]);

  const totales = useMemo(() => {
    if (!columnas.some((col) => col.total)) return null;
    return Object.fromEntries(
      columnas
        .filter((col) => col.total)
        .map((col) => [col.c, filas.reduce((suma, fila) => suma + (Number(fila[col.c]) || 0), 0)]),
    );
  }, [filas, columnas]);

  const ordenarPor = (campo) =>
    setOrden((actual) => (actual.campo === campo ? { campo, asc: !actual.asc } : { campo, asc: false }));

  return (
    <div className={`reportes-tabla-contenedor ${actualizando ? "esta-actualizando" : ""}`}>
      <div className="reportes-tabla-barra">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Filtrar estos resultados..."
          aria-label="Filtrar resultados"
        />
        <span>
          {filas.length === datos.length
            ? `${datos.length} ${datos.length === 1 ? "resultado" : "resultados"}`
            : `${filas.length} de ${datos.length} resultados`}
        </span>
        <div className="reportes-tabla-acciones">
          <button type="button" disabled={!filas.length} onClick={() => alExportar("csv", filas, totales, texto)}>
            Descargar CSV
          </button>
          <button
            type="button"
            className="es-principal"
            disabled={!filas.length}
            onClick={() => alExportar("pdf", filas, totales, texto)}
          >
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="reportes-tabla-scroll">
        <table className="reportes-tabla">
          <thead>
            <tr>
              {columnas.map((col) => (
                <th
                  key={col.c}
                  className={TIPOS_NUMERICOS.includes(col.tipo) ? "es-numero" : ""}
                  aria-sort={orden.campo === col.c ? (orden.asc ? "ascending" : "descending") : "none"}
                >
                  <button type="button" onClick={() => ordenarPor(col.c)}>
                    {col.t}
                    <span aria-hidden="true">{orden.campo === col.c ? (orden.asc ? " ▲" : " ▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={columnas.length} className="reportes-tabla__vacio">
                  {datos.length ? "Ningún resultado coincide con el filtro." : "No hay resultados para este período."}
                </td>
              </tr>
            ) : (
              filas.map((fila, indice) => (
                <tr key={indice}>
                  {columnas.map((col) => {
                    const valor = fila[col.c];
                    const clases = [
                      TIPOS_NUMERICOS.includes(col.tipo) ? "es-numero" : "",
                      col.largo ? "es-largo" : "",
                      col.resaltar?.(valor) ? "es-resaltado" : "",
                    ].join(" ");

                    return (
                      <td key={col.c} className={clases}>
                        {col.nivel ? (
                          <span className={`reportes-insignia reportes-insignia--${col.nivel(fila)}`}>
                            {valor ?? col.vacio ?? "—"}
                          </span>
                        ) : col.barra ? (
                          <span className="reportes-celda-barra">
                            <span style={{ width: `${Math.min(Number(valor) || 0, 100) * 0.6}px` }} />
                            {formatearValor(col.tipo, valor)}
                          </span>
                        ) : (
                          formatearValor(col.tipo, valor)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>

          {totales && filas.length > 0 && (
            <tfoot>
              <tr>
                {columnas.map((col, i) => (
                  <td key={col.c} className={col.total ? "es-numero" : ""}>
                    {i === 0 ? "Total" : col.total ? formatearValor(col.tipo, totales[col.c]) : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ==================================================
// PÁGINA
// ==================================================

function Reportes() {
  const [tipo, setTipo] = useState("ventas");
  const [desde, setDesde] = useState(() => rangoPreset("mes")[0]);
  const [hasta, setHasta] = useState(() => rangoPreset("mes")[1]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAplicada, setBusquedaAplicada] = useState("");
  const [recargas, setRecargas] = useState(0);
  const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
  const [resultado, setResultado] = useState({ clave: null, tipo: null });
  const [kpis, setKpis] = useState({ clave: null, resumen: null, alertas: null });

  const rangoValido = Boolean(desde && hasta && desde <= hasta);
  const reporte = REPORTES[tipo];

  const consulta = useMemo(
    () => ({ tipo, desde, hasta, filtros, busqueda: busquedaAplicada, recargas }),
    [tipo, desde, hasta, filtros, busquedaAplicada, recargas],
  );
  const clave = useMemo(() => JSON.stringify(consulta), [consulta]);
  const claveKpis = `${desde}|${hasta}|${recargas}`;

  // Reporte de la pestaña activa (el estado se actualiza al llegar la respuesta)
  useEffect(() => {
    if (!rangoValido) return undefined;
    let vigente = true;
    consultarReporte(consulta).then((respuesta) => {
      if (vigente) setResultado({ clave, tipo: consulta.tipo, ...respuesta });
    });
    return () => {
      vigente = false;
    };
  }, [consulta, clave, rangoValido]);

  // KPI del período + contador de alertas (solo dependen de las fechas)
  useEffect(() => {
    if (!rangoValido) return undefined;
    let vigente = true;
    consultarKpis(desde, hasta).then((respuesta) => {
      if (vigente) setKpis({ clave: claveKpis, ...respuesta });
    });
    return () => {
      vigente = false;
    };
  }, [desde, hasta, claveKpis, rangoValido]);

  // Catálogos de los filtros (estados, métodos de pago, tipos de despacho)
  useEffect(() => {
    let vigente = true;
    supabase.rpc("reporte_filtros_admin").then(({ data }) => {
      if (vigente && data) setCatalogos({ ...CATALOGOS_VACIOS, ...data });
    });
    return () => {
      vigente = false;
    };
  }, []);

  const cargando = rangoValido && resultado.clave !== clave;
  const mismoTipo = resultado.tipo === tipo;
  const datos = useMemo(() => (mismoTipo ? resultado.datos ?? [] : []), [mismoTipo, resultado.datos]);
  const periodoTexto = `${formatearFecha(desde)} al ${formatearFecha(hasta)}`;
  const visibles = reporte.filtros ?? [];
  const listaKpis = kpisDelPeriodo(kpis.resumen);

  const graficos = useMemo(
    () => reporte.graficos(filtros).map((config) => prepararGrafico(config, datos)),
    [reporte, filtros, datos],
  );

  const cambiarFiltro = (campo, valor) => setFiltros((previo) => ({ ...previo, [campo]: valor }));

  const cambiarTipo = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setBusqueda("");
    setBusquedaAplicada("");
  };

  const aplicarPreset = (clavePreset) => {
    const [nuevoDesde, nuevoHasta] = rangoPreset(clavePreset);
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
  };

  // Texto de los filtros aplicados (para el PDF)
  const describirFiltros = (textoLocal) => {
    const nombreDe = (lista, id) => lista.find((item) => String(item.id) === String(id))?.nombre;
    const partes = [];
    if (visibles.includes("agrupacion")) partes.push(`Agrupado por ${NOMBRE_AGRUPACION[filtros.agrupacion]}`);
    if (visibles.includes("agrupacionCategoria")) partes.push(`Agrupado por ${filtros.agrupacionCategoria}`);
    if (visibles.includes("estadoPedido") && filtros.estadoPedido)
      partes.push(`Estado: ${nombreDe(catalogos.estados_pedido, filtros.estadoPedido)}`);
    if (visibles.includes("tipoDespacho") && filtros.tipoDespacho)
      partes.push(`Tipo de despacho: ${nombreDe(catalogos.tipos_despacho, filtros.tipoDespacho)}`);
    if (visibles.includes("estadoCotizacion") && filtros.estadoCotizacion)
      partes.push(`Estado: ${nombreDe(catalogos.estados_cotizacion, filtros.estadoCotizacion)}`);
    if (visibles.includes("estadoPago") && filtros.estadoPago)
      partes.push(`Estado de pago: ${nombreDe(catalogos.estados_pago, filtros.estadoPago)}`);
    if (visibles.includes("metodoPago") && filtros.metodoPago)
      partes.push(`Método: ${nombreDe(catalogos.metodos_pago, filtros.metodoPago)}`);
    if (busquedaAplicada) partes.push(`Búsqueda: "${busquedaAplicada}"`);
    if (textoLocal.trim()) partes.push(`Filtro de tabla: "${textoLocal.trim()}"`);
    return partes;
  };

  const exportar = (formato, filas, totales, textoLocal) => {
    const nombreArchivo = `ferreplast-${tipo}-${desde}-a-${hasta}`;

    if (formato === "csv") {
      descargarCSV({ titulo: reporte.titulo, periodo: periodoTexto, columnas: reporte.columnas, filas, totales, nombreArchivo });
      return;
    }

    imprimirPDF({
      titulo: reporte.titulo,
      descripcion: reporte.descripcion,
      periodo: periodoTexto,
      filtros: describirFiltros(textoLocal),
      kpis: listaKpis.map((k) => {
        const cambio = variacion(k.valor, k.anterior);
        const esBueno = cambio === null || cambio === 0 ? null : cambio > 0 !== Boolean(k.menosEsMejor);
        return {
          titulo: k.titulo,
          valor: formatearValor(k.tipo, k.valor ?? 0),
          nota: textoVariacion(k.valor, k.anterior) ?? "Sin datos del período anterior",
          clase: esBueno === null ? "" : esBueno ? "bueno" : "malo",
        };
      }),
      graficos: reporte.graficos(filtros).map((config) => prepararGrafico(config, filas)),
      agrupacion: filtros.agrupacion,
      columnas: reporte.columnas,
      filas,
      totales,
      logoUrl: new URL(logoFerreplast, window.location.href).href,
      nombreDocumento: nombreArchivo,
    });
  };

  const selectorCatalogo = (campo, etiqueta, lista) => (
    <label>
      {etiqueta}
      <select value={filtros[campo]} onChange={(e) => cambiarFiltro(campo, e.target.value)}>
        <option value="">Todos</option>
        {lista.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="admin-page reportes">
      <style>{ESTILOS}</style>
      <AdminHeader
        titulo="Reportes"
        descripcion="KPI del período, gráficos y detalle de ventas, pedidos, pagos, cotizaciones e inventario. Descarga en CSV o PDF."
      />

      {/* FECHAS Y FILTROS */}
      <form
        className="reportes-filtros"
        onSubmit={(e) => {
          e.preventDefault();
          setBusquedaAplicada(busqueda.trim());
          setRecargas((n) => n + 1);
        }}
      >
        <div className="reportes-presets">
          {PRESETS_FECHA.map(([clavePreset, etiqueta]) => {
            const [d, h] = rangoPreset(clavePreset);
            return (
              <button
                key={clavePreset}
                type="button"
                className={d === desde && h === hasta ? "es-activo" : ""}
                onClick={() => aplicarPreset(clavePreset)}
              >
                {etiqueta}
              </button>
            );
          })}
        </div>

        <div className="reportes-filtros__campos">
          <label>
            Desde
            <input type="date" required value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} />
          </label>

          <label>
            Hasta
            <input type="date" required value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} />
          </label>

          {visibles.includes("agrupacion") && (
            <label>
              Agrupar por
              <select value={filtros.agrupacion} onChange={(e) => cambiarFiltro("agrupacion", e.target.value)}>
                <option value="day">Día</option>
                <option value="week">Semana</option>
                <option value="month">Mes</option>
              </select>
            </label>
          )}

          {visibles.includes("agrupacionCategoria") && (
            <label>
              Agrupar por
              <select
                value={filtros.agrupacionCategoria}
                onChange={(e) => cambiarFiltro("agrupacionCategoria", e.target.value)}
              >
                <option value="familia">Familia</option>
                <option value="subcategoria">Subcategoría</option>
                <option value="marca">Marca</option>
              </select>
            </label>
          )}

          {visibles.includes("limite") && (
            <label>
              Mostrar
              <select value={filtros.limite} onChange={(e) => cambiarFiltro("limite", e.target.value)}>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
                <option value="1000">Todos</option>
              </select>
            </label>
          )}

          {visibles.includes("estadoPedido") &&
            selectorCatalogo("estadoPedido", "Estado del pedido", catalogos.estados_pedido)}
          {visibles.includes("tipoDespacho") &&
            selectorCatalogo("tipoDespacho", "Tipo de despacho", catalogos.tipos_despacho)}
          {visibles.includes("estadoCotizacion") &&
            selectorCatalogo("estadoCotizacion", "Estado de la cotización", catalogos.estados_cotizacion)}
          {visibles.includes("estadoPago") &&
            selectorCatalogo("estadoPago", "Estado del pago", catalogos.estados_pago)}
          {visibles.includes("metodoPago") &&
            selectorCatalogo("metodoPago", "Método de pago", catalogos.metodos_pago)}

          {visibles.includes("busqueda") && (
            <label className="reportes-filtros__busqueda">
              Folio, cliente o RUT
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Escribe y presiona Buscar"
              />
            </label>
          )}

          <button type="submit" className="reportes-boton-principal" disabled={!rangoValido}>
            {cargando ? "Consultando..." : "Buscar / actualizar"}
          </button>
        </div>
      </form>

      {!rangoValido && (
        <div role="alert" className="reportes-error">
          Selecciona un rango de fechas válido: "Desde" no puede ser posterior a "Hasta".
        </div>
      )}

      {/* KPI CLAVE DEL PERÍODO */}
      {rangoValido && listaKpis.length > 0 && (
        <div className={`reportes-kpis ${kpis.clave !== claveKpis ? "esta-actualizando" : ""}`}>
          {listaKpis.map((k) => (
            <TarjetaKpi
              key={k.titulo}
              titulo={k.titulo}
              tipo={k.tipo}
              valor={k.valor}
              anterior={k.anterior}
              detalle={k.detalle}
              menosEsMejor={k.menosEsMejor}
            />
          ))}
        </div>
      )}

      {/* PESTAÑAS */}
      <nav className="reportes-pestanas" aria-label="Tipo de reporte">
        {Object.entries(REPORTES).map(([claveReporte, r]) => (
          <button
            key={claveReporte}
            type="button"
            className={tipo === claveReporte ? "es-activa" : ""}
            aria-current={tipo === claveReporte ? "page" : undefined}
            onClick={() => cambiarTipo(claveReporte)}
          >
            {r.titulo}
            {claveReporte === "alertas" && kpis.alertas > 0 && (
              <span className="reportes-pestanas__contador">{kpis.alertas}</span>
            )}
          </button>
        ))}
      </nav>

      {/* CONTENIDO */}
      <div className="reportes-contenido">
        <div className="reportes-encabezado">
          <h2>{reporte.titulo}</h2>
          <p>{reporte.descripcion}</p>
        </div>

        {rangoValido && mismoTipo && resultado.error && (
          <div role="alert" className="reportes-error">
            {resultado.error}
          </div>
        )}

        {rangoValido && !mismoTipo && cargando && <p className="reportes-cargando">Cargando reporte...</p>}

        {rangoValido && mismoTipo && !resultado.error && (
          <>
            <div
              className={`reportes-graficos ${graficos.length > 1 ? "es-doble" : ""} ${
                cargando ? "esta-actualizando" : ""
              }`}
            >
              {graficos.map((g) => (
                <Grafico key={g.titulo} grafico={g} agrupacion={filtros.agrupacion} />
              ))}
            </div>

            <TablaReporte key={tipo} reporte={reporte} datos={datos} actualizando={cargando} alExportar={exportar} />
          </>
        )}
      </div>
    </section>
  );
}

export default Reportes;