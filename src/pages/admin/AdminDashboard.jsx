import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuClock, LuPackage, LuPackageCheck, LuRotateCcw, LuTriangleAlert } from "react-icons/lu";
import { supabase } from "../../lib/supabase";
import AdminHeader from "./components/AdminHeader";
import { validarRespuestaComercial } from "../../utils/admin/reportes/reportesComerciales";
import { segmentosAnillo } from "../../utils/admin/reportes/reportesPresentacion";
import { ESTADO_PEDIDO, ESTADOS_LISTOS, ESTADOS_PENDIENTES } from "../../utils/Pedidos/estadoPedido";
import "./Css/AdminDashboard.css";

// =====================================================================
// PANEL DE ADMINISTRACIÓN (archivo autocontenido)
// - Una sola página con todas las secciones, una debajo de otra:
//   Resumen, Pedidos, Pagos, Cotizaciones, Inventario, Aprobaciones,
//   Clientes y Equipo.
// - La barra de arriba queda fija: sus botones llevan a cada sección y se
//   marca sola la sección que se está viendo.
// - Gráficos nativos en SVG y CSS (sin ECharts ni otras librerías).
// - Estilos en Css/AdminDashboard.css (clases con prefijo pa-).
// - Solo usa funciones SQL y tablas que ya existen en Supabase.
// - Todas las secciones cargan a la vez; si dos piden lo mismo, la consulta
//   se hace una sola vez. Se actualiza cada 5 minutos o con "Actualizar".
// =====================================================================

// =====================================================================
// CONFIGURACIÓN
// =====================================================================

const ZONA_HORARIA = "America/Santiago";
const HORAS_ATRASO = 24; // mismo criterio que el dashboard de bodega
const AUTO_ACTUALIZAR_MS = 5 * 60 * 1000;
const CLAVE_META = "ferreplast.panelAdmin.metaMensual";
// kpi_alerta_stock: prioridad de productos fuera del control de stock (Stock de bodega también los excluye)
const PRIORIDAD_EXCLUIDA = 7;
const ROL = { CLIENTE: 0, ADMINISTRADOR: 1, BODEGUERO: 2 };
const ESTADO_PRODUCTO_PENDIENTE = 1;
const ESTADO_MARCA_PENDIENTE = 1;
const ESTADOS_COTIZACION = ["Pendiente", "Completada", "Exitosa", "Fallida"];

// Textos que devuelven las funciones SQL. Si cambian en Supabase, hay que cambiarlos aquí.
const TEXTOS_SQL = {
  pagoAutorizado: "AUTORIZADO",
  severidadAlta: "alta",
  alertaPagoSinResultado: "Pago sin resultado final",
  indicadorStockSinVentas: "Con stock sin ventas",
  indicadorPendientes: "Pendientes actuales",
};

const PERIODOS = [
  { id: "7d", texto: "7 días" },
  { id: "30d", texto: "30 días" },
  { id: "mes", texto: "Este mes" },
];

// =====================================================================
// FORMATO Y FECHAS
// =====================================================================

const formatoMoneda = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const formatoNumero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const formatoCompacto = new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 });

// Día en Chile (AAAA-MM-DD) de una fecha
function diaDe(fecha) {
  return new Date(fecha).toLocaleDateString("sv-SE", { timeZone: ZONA_HORARIA });
}

function sumarDias(iso, dias) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

function diasEntre(desde, hasta) {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 864e5) + 1;
}

// Rango [desde, hasta] del período elegido, ambos incluidos
function rangoPeriodo(id, hoy) {
  if (id === "7d") return [sumarDias(hoy, -6), hoy];
  if (id === "mes") return [`${hoy.slice(0, 7)}-01`, hoy];
  return [sumarDias(hoy, -29), hoy];
}

// Período inmediatamente anterior, con la misma cantidad de días
function rangoAnterior(desde, hasta) {
  const dias = diasEntre(desde, hasta);
  return [sumarDias(desde, -dias), sumarDias(desde, -1)];
}

function estaEnRango(fecha, desde, hasta) {
  if (!fecha) return false;
  const dia = diaDe(fecha);
  return dia >= desde && dia <= hasta;
}

function formatearValor(tipo, valor) {
  if (valor === null || valor === undefined || valor === "") return "—";
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);
  if (tipo === "moneda") return formatoMoneda.format(numero);
  if (tipo === "porcentaje") return `${formatoNumero.format(numero)} %`;
  if (tipo === "dias") return `${formatoNumero.format(numero)} ${numero === 1 ? "día" : "días"}`;
  if (tipo === "horas") return `${formatoNumero.format(numero)} h`;
  return formatoNumero.format(numero);
}

// "2026-10-08" → "8 oct"
function etiquetaDia(iso) {
  if (!iso) return "";
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
}

// Cambio % respecto del período anterior (null si el anterior es cero)
function variacion(actual, anterior) {
  const a = Number(actual);
  const b = Number(anterior);
  if (Number.isNaN(a) || Number.isNaN(b) || b === 0) return null;
  return ((a - b) / b) * 100;
}

function textoVariacion(actual, anterior, tipo) {
  if (anterior === undefined || anterior === null) return "";
  const cambio = variacion(actual, anterior);
  if (cambio === null) return `Antes: ${formatearValor(tipo, anterior)}`;
  if (Math.round(cambio) === 0) return "Igual que el período anterior";
  return `${cambio > 0 ? "▲" : "▼"} ${formatoNumero.format(Math.abs(cambio))} % vs período anterior`;
}

function tonoVariacion(actual, anterior, menosEsMejor = false) {
  const cambio = variacion(actual, anterior);
  if (cambio === null || Math.round(cambio) === 0) return "";
  return cambio > 0 !== menosEsMejor ? "bueno" : "malo";
}

function textoActualizado(cargadoEn, ahora) {
  const minutos = Math.floor((ahora - cargadoEn) / 60000);
  return minutos < 1 ? "Actualizado recién" : `Actualizado hace ${minutos} min`;
}

const cantidad = (n, singular, plural) => `${formatoNumero.format(n)} ${n === 1 ? singular : plural}`;

// =====================================================================
// AYUDANTES DE DATOS
// =====================================================================

const lista = (valor) => (Array.isArray(valor) ? valor : []);
const numero = (valor) => Number(valor) || 0;
const normalizar = (texto) => String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const igual = (a, b) => normalizar(a) === normalizar(b);

// Agrupa filas por un campo y suma (o cuenta) por grupo, de mayor a menor
function agrupar(filas, campo, valorDe = () => 1, { vacio = "Sin dato", categorias } = {}) {
  const grupos = new Map((categorias ?? []).map((nombre) => [nombre, 0]));
  lista(filas).forEach((fila) => {
    const clave = fila?.[campo] == null || fila[campo] === "" ? vacio : String(fila[campo]);
    grupos.set(clave, (grupos.get(clave) ?? 0) + numero(valorDe(fila)));
  });
  const puntos = [...grupos].map(([etiqueta, valor]) => ({ etiqueta, valor }));
  return categorias ? puntos : puntos.sort((a, b) => b.valor - a.valor);
}

// Deja los primeros grupos y junta el resto en "Otras"
function limitarGrupos(puntos, maximo) {
  if (puntos.length <= maximo) return puntos;
  const resto = puntos.slice(maximo - 1).reduce((suma, punto) => suma + punto.valor, 0);
  return [...puntos.slice(0, maximo - 1), { etiqueta: "Otras", valor: resto }];
}

const esPendiente = (pedido) => ESTADOS_PENDIENTES.includes(Number(pedido?.id_estado));
const esListo = (pedido) => ESTADOS_LISTOS.includes(Number(pedido?.id_estado));
const esFinalizado = (pedido) => Number(pedido?.id_estado) === ESTADO_PEDIDO.FINALIZADO;
const horasDesde = (fecha) => (Date.now() - new Date(fecha).getTime()) / 36e5;
const esAtrasado = (pedido) => esPendiente(pedido) && Boolean(pedido?.fecha_pedido) && horasDesde(pedido.fecha_pedido) >= HORAS_ATRASO;

const productosControlados = (stock) => lista(stock).filter((p) => numero(p.prioridad_stock) !== PRIORIDAD_EXCLUIDA);
const precioEfectivo = (p) => (numero(p.precio_act) > 0 ? numero(p.precio_act) : numero(p.precio_prod));
const indicador = (respuesta, titulo) => lista(respuesta?.indicadores).find((item) => igual(item.titulo, titulo))?.valor ?? null;

// Pedidos pagados ÷ pedidos creados del período (en %)
const conversion = (kpis) =>
  kpis && numero(kpis.pedidos_creados) > 0 ? Math.min((numero(kpis.pedidos_pagados) / numero(kpis.pedidos_creados)) * 100, 100) : null;

// Meta mensual de ventas: se guarda en este navegador
function leerMeta() {
  try {
    const valor = Number(localStorage.getItem(CLAVE_META));
    return valor > 0 ? valor : null;
  } catch {
    return null;
  }
}

function guardarMeta(valor) {
  try {
    if (valor) localStorage.setItem(CLAVE_META, String(valor));
    else localStorage.removeItem(CLAVE_META);
  } catch {
    // Sin almacenamiento disponible: la meta dura hasta recargar la página
  }
}

// =====================================================================
// CONSULTAS A SUPABASE
// =====================================================================

async function rpc(nombre, parametros) {
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) throw error;
  return data;
}

async function contar(tabla, aplicarFiltros) {
  const { count, error } = await aplicarFiltros(supabase.from(tabla).select("*", { count: "exact", head: true }));
  if (error) throw error;
  return count ?? 0;
}

// Contexto de una carga: rango de fechas y consultas compartidas.
// Si dos secciones piden la misma consulta, se hace una sola vez.
function crearContexto({ desde, hasta, hoy }) {
  const promesas = new Map();
  const unaVez = (clave, consultar) => {
    if (!promesas.has(clave)) promesas.set(clave, consultar());
    return promesas.get(clave);
  };

  return {
    desde,
    hasta,
    hoy,
    unaVez,
    llamar: (nombre, parametros = {}) => unaVez(`rpc:${nombre}:${JSON.stringify(parametros)}`, () => rpc(nombre, parametros)),
    comercial: async (nombre, parametros) =>
      validarRespuestaComercial(await unaVez(`rpc:${nombre}:${JSON.stringify(parametros)}`, () => rpc(nombre, parametros))),
    contar: (clave, tabla, aplicarFiltros) => unaVez(`contar:${clave}`, () => contar(tabla, aplicarFiltros)),
  };
}

// Ejecuta varias consultas a la vez. Las que fallan quedan en null y se informan.
async function cargarVarias(consultas) {
  const claves = Object.keys(consultas);
  const resultados = await Promise.allSettled(claves.map((clave) => consultas[clave]()));
  const datos = {};
  const fallidas = [];
  resultados.forEach((resultado, indice) => {
    const clave = claves[indice];
    datos[clave] = resultado.status === "fulfilled" ? resultado.value : null;
    if (resultado.status === "rejected") {
      fallidas.push({ clave, codigo: resultado.reason?.code ?? null });
      console.error(`Panel admin: no se pudo cargar "${clave}"`, { codigo: resultado.reason?.code, estado: resultado.reason?.status });
    }
  });
  return { datos, fallidas };
}

// Consultas que usan varias secciones
const consulta = {
  resumen: (ctx, desde = ctx.desde, hasta = ctx.hasta) => () => ctx.llamar("reporte_resumen_admin", { p_desde: desde, p_hasta: hasta }),
  ventas: (ctx, desde, hasta) => () => ctx.llamar("reporte_ventas_admin", { p_desde: desde, p_hasta: hasta, p_agrupar: "day" }),
  alertas: (ctx, desde = ctx.desde, hasta = ctx.hasta) => () => ctx.llamar("reporte_alertas_admin", { p_desde: desde, p_hasta: hasta }),
  pedidosActuales: (ctx) => () => ctx.llamar("obtener_pedidos_admin"),
  stock: (ctx) => () => ctx.llamar("kpi_alerta_stock"),
  pedidosPeriodo: (ctx, idEstado = null) => () =>
    ctx.llamar("reporte_pedidos_admin", { p_desde: ctx.desde, p_hasta: ctx.hasta, p_id_estado: idEstado, p_folio: null, p_id_tipo_despacho: null }),
  aprobaciones: (ctx) => async () => {
    const [productos, marcas, cambios] = await Promise.all([
      ctx.contar("productos-pendientes", "producto", (q) => q.eq("est_prod", ESTADO_PRODUCTO_PENDIENTE)),
      ctx.contar("marcas-pendientes", "marca_producto", (q) => q.eq("id_estado_marca", ESTADO_MARCA_PENDIENTE)),
      ctx.contar("cambios-sin-revisar", "producto_cambio", (q) => q.eq("revisado", false).not("id_user", "is", null)),
    ]);
    return { productos, marcas, cambios };
  },
};

// Horas hábiles de espera (función SQL horas_habiles), una consulta por pedido
async function conHorasHabiles(ctx, pedidos) {
  const fin = new Date().toISOString();
  return Promise.all(
    pedidos.map(async (pedido) => {
      try {
        return { ...pedido, horas_habiles: Number(await ctx.llamar("horas_habiles", { p_inicio: pedido.fecha_pedido, p_fin: fin })) };
      } catch {
        return { ...pedido, horas_habiles: null };
      }
    }),
  );
}

// =====================================================================
// SECCIONES: cada una consulta sus datos y arma tarjetas y gráficos.
// Devuelven { vista, fallidas }. Un gráfico con puntos: null = falló.
// =====================================================================

async function cargarResumen(ctx) {
  const { desde, hasta, hoy } = ctx;
  const [desdeAnterior, hastaAnterior] = rangoAnterior(desde, hasta);
  const inicioMes = `${hoy.slice(0, 7)}-01`;

  const { datos, fallidas } = await cargarVarias({
    resumen: consulta.resumen(ctx),
    resumenMes: consulta.resumen(ctx, inicioMes, hoy),
    ventas: consulta.ventas(ctx, desde, hasta),
    ventasAnteriores: consulta.ventas(ctx, desdeAnterior, hastaAnterior),
    productos: () => ctx.comercial("reporte_productos_comercial_admin", { p_desde: desde, p_hasta: hasta, p_orden: "monto", p_limite: 10 }),
    familias: () => ctx.llamar("reporte_categorias_admin", { p_desde: desde, p_hasta: hasta, p_agrupar: "familia" }),
    alertas: consulta.alertas(ctx, ...rangoPeriodo("30d", hoy)), // siempre los últimos 30 días
    pedidos: consulta.pedidosActuales(ctx),
    aprobaciones: consulta.aprobaciones(ctx),
    stock: consulta.stock(ctx),
  });
  const { resumen, resumenMes, ventas, ventasAnteriores, productos, familias, alertas, pedidos, aprobaciones, stock } = datos;
  const a = resumen?.actual;
  const b = resumen?.anterior;
  const boletas = lista(ventas).reduce((s, f) => s + numero(f.boletas), 0);
  const facturas = lista(ventas).reduce((s, f) => s + numero(f.facturas), 0);
  const anteriores = lista(ventasAnteriores);

  return {
    fallidas,
    vista: {
      alcance: "Lo más importante del negocio en el período elegido.",
      kpis: a
        ? [
            { titulo: "Total vendido", tipo: "moneda", valor: a.total_vendido, anterior: b?.total_vendido },
            { titulo: "Pedidos pagados", valor: a.pedidos_pagados, anterior: b?.pedidos_pagados,
              detalle: ventas ? `${cantidad(boletas, "boleta", "boletas")} · ${cantidad(facturas, "factura", "facturas")}` : undefined },
            { titulo: "Ticket promedio", tipo: "moneda", valor: a.ticket_promedio, anterior: b?.ticket_promedio, detalle: "Gasto promedio por pedido" },
            { titulo: "Clientes que compraron", valor: a.clientes_compradores, anterior: b?.clientes_compradores },
            { titulo: "Unidades vendidas", valor: a.unidades_vendidas, anterior: b?.unidades_vendidas },
            { titulo: "Conversión de pedidos", tipo: "porcentaje", valor: conversion(a), anterior: conversion(b) ?? undefined,
              detalle: "Pagados ÷ pedidos creados" },
          ]
        : [],
      ventasMes: resumenMes?.actual?.total_vendido ?? null,
      ventasDia: ventas
        ? lista(ventas).map((f, i) => ({
            etiqueta: f.periodo,
            valor: numero(f.total_vendido),
            pedidos: numero(f.cant_pedidos),
            anterior: anteriores[i] ? numero(anteriores[i].total_vendido) : null,
          }))
        : null,
      topProductos: productos
        ? lista(productos.datos).slice(0, 5).map((f) => ({ etiqueta: f.producto, valor: numero(f.monto), detalle: f.presentacion || "" }))
        : null,
      ventasFamilia: familias
        ? limitarGrupos(lista(familias).map((f) => ({ etiqueta: f.grupo, valor: numero(f.monto) })).filter((p) => p.valor > 0), 5)
        : null,
      atencion: [
        { titulo: "Alertas altas", Icono: LuTriangleAlert, tono: "alerta", ruta: "/admin/reportes?tipo=alertas", detalle: "Últimos 30 días",
          valor: alertas ? lista(alertas).filter((x) => igual(x.severidad, TEXTOS_SQL.severidadAlta)).length : null },
        { titulo: "Pedidos atrasados", Icono: LuClock, tono: "aviso", ruta: "/admin/pedidos", detalle: `Pagados y sin preparar hace +${HORAS_ATRASO} h`,
          valor: pedidos ? lista(pedidos).filter(esAtrasado).length : null },
        { titulo: "Por aprobar", Icono: LuPackageCheck, tono: "aviso", ruta: "/admin/aprobaciones", detalle: "Productos, marcas y cambios",
          valor: aprobaciones ? aprobaciones.productos + aprobaciones.marcas + aprobaciones.cambios : null },
        { titulo: "Productos sin stock", Icono: LuPackage, tono: "aviso", ruta: "/admin/reportes?tipo=inventario",
          valor: stock ? productosControlados(stock).filter((p) => p.sin_stock).length : null },
      ],
    },
  };
}

async function cargarPedidos(ctx) {
  const { desde, hasta } = ctx;
  const { datos, fallidas } = await cargarVarias({ todos: consulta.pedidosActuales(ctx), periodo: consulta.pedidosPeriodo(ctx) });
  const { todos, periodo } = datos;
  const pedidos = lista(todos);
  const pagados = lista(periodo).filter((f) => f.pagado);
  const contarSi = (condicion) => (todos ? pedidos.filter(condicion).length : null);

  const masAntiguos = await conHorasHabiles(
    ctx,
    pedidos
      .filter((p) => esPendiente(p) && p.fecha_pedido)
      .sort((x, y) => new Date(x.fecha_pedido) - new Date(y.fecha_pedido))
      .slice(0, 5),
  );

  return {
    fallidas,
    vista: {
      alcance: "Tarjetas: estado actual. Gráficos: pedidos pagados creados en el período.",
      kpis: [
        { titulo: "Por preparar", valor: contarSi(esPendiente) },
        { titulo: `Atrasados +${HORAS_ATRASO} h`, valor: contarSi(esAtrasado), tono: "alerta", detalle: "Mismo criterio que bodega" },
        { titulo: "Listos para entregar", valor: contarSi(esListo) },
        { titulo: "Finalizados", valor: contarSi((p) => esFinalizado(p) && estaEnRango(p.fecha_pedido, desde, hasta)), detalle: "Pedidos del período ya entregados" },
      ],
      graficos: [
        { titulo: "Por tipo de entrega", vista: "anillo", puntos: periodo ? agrupar(pagados, "tipo_despacho") : null },
        { titulo: "Por estado", vista: "barras", puntos: periodo ? agrupar(pagados, "estado") : null },
        { titulo: "Más antiguos por preparar", nota: "Horas hábiles de espera", vista: "lista", formato: "horas", ancho: true,
          vacio: "No hay pedidos por preparar.",
          puntos: todos
            ? masAntiguos.map((p) => ({
                etiqueta: p.folio_pedido ?? (p.id_pedido ? `Pedido ${p.id_pedido}` : "Pedido sin folio"),
                detalle: `${p.cliente ?? "Cliente"} · hace ${formatearValor("horas", Math.round(horasDesde(p.fecha_pedido)))} de reloj`,
                valor: p.horas_habiles,
              }))
            : null },
      ],
      enlace: { texto: "Ir a Pedidos", ruta: "/admin/pedidos" },
    },
  };
}

async function cargarPagos(ctx) {
  const { datos, fallidas } = await cargarVarias({
    pagos: () => ctx.llamar("reporte_pagos_admin", { p_desde: ctx.desde, p_hasta: ctx.hasta, p_folio: null, p_id_estado_pago: null, p_id_metodo: null }),
    resumen: consulta.resumen(ctx),
    alertas: consulta.alertas(ctx),
  });
  const { pagos, resumen, alertas } = datos;
  const autorizados = lista(pagos).filter((f) => igual(f.codigo_estado, TEXTOS_SQL.pagoAutorizado));

  return {
    fallidas,
    vista: {
      alcance: "Registros de pago del período.",
      kpis: [
        { titulo: "Monto autorizado", tipo: "moneda", valor: pagos ? autorizados.reduce((s, f) => s + numero(f.monto), 0) : null },
        { titulo: "Pagos autorizados", valor: pagos ? autorizados.length : null },
        { titulo: "Intentos fallidos", valor: resumen?.actual?.pagos_fallidos ?? null, anterior: resumen?.anterior?.pagos_fallidos,
          menosEsMejor: true, detalle: "Un pedido puede tener varios intentos" },
        { titulo: "Sin resultado +1 h", tono: "aviso",
          valor: alertas ? lista(alertas).filter((x) => igual(x.tipo, TEXTOS_SQL.alertaPagoSinResultado)).length : null },
      ],
      graficos: [
        { titulo: "Monto autorizado por método", vista: "anillo", formato: "moneda", puntos: pagos ? agrupar(autorizados, "metodo_pago", (f) => f.monto) : null },
        { titulo: "Intentos por estado", vista: "barras", puntos: pagos ? agrupar(pagos, "estado_pago") : null },
      ],
      enlace: { texto: "Ir a Pagos", ruta: "/admin/pagos" },
    },
  };
}

async function cargarCotizaciones(ctx) {
  const parametros = (vista) => ({ p_desde: ctx.desde, p_hasta: ctx.hasta, p_vista: vista, p_id_estado: null, p_folio: null });
  const { datos, fallidas } = await cargarVarias({
    seguimiento: () => ctx.comercial("reporte_cotizaciones_comercial_admin", parametros("seguimiento")),
    externos: () => ctx.comercial("reporte_cotizaciones_comercial_admin", parametros("externos")),
  });
  const { seguimiento, externos } = datos;

  return {
    fallidas,
    vista: {
      alcance: "Solicitudes recibidas en el período, con su estado actual.",
      kpis: lista(seguimiento?.indicadores).map((item) => {
        const pendientes = igual(item.titulo, TEXTOS_SQL.indicadorPendientes);
        return {
          titulo: pendientes ? "Por completar" : item.titulo,
          tipo: item.tipo,
          valor: item.valor,
          tono: pendientes ? "aviso" : undefined,
          detalle: item.tipo === "porcentaje" && item.valor == null ? "Sin cotizaciones resueltas" : undefined,
        };
      }),
      graficos: [
        { titulo: "Estado de las solicitudes", vista: "anillo",
          puntos: seguimiento ? agrupar(seguimiento.datos, "estado", undefined, { categorias: ESTADOS_COTIZACION }) : null },
        { titulo: "Más pedidos fuera del catálogo", vista: "barras",
          puntos: externos
            ? [...lista(externos.datos)]
                .sort((x, y) => numero(y.solicitudes) - numero(x.solicitudes))
                .slice(0, 5)
                .map((f) => ({ etiqueta: f.marca ? `${f.producto} · ${f.marca}` : f.producto, valor: numero(f.solicitudes) }))
            : null },
      ],
      enlace: { texto: "Ir a Cotizaciones", ruta: "/admin/cotizaciones" },
    },
  };
}

async function cargarInventario(ctx) {
  const { datos, fallidas } = await cargarVarias({
    stock: consulta.stock(ctx),
    situacion: () => ctx.comercial("reporte_stock_comercial_admin", { p_desde: ctx.desde, p_hasta: ctx.hasta }),
  });
  const { stock, situacion } = datos;
  const controlados = productosControlados(stock);
  const reponer = controlados
    .filter((p) => !p.sin_stock && (p.stock_bajo || [2, 3].includes(numero(p.prioridad_stock))))
    .slice(0, 5)
    .map((p) => ({
      etiqueta: p.nom_prod,
      valor: p.dias_cobertura == null ? null : Number(p.dias_cobertura),
      detalle: `${numero(p.stock_prod)} ${p.nom_und_medida ?? "u."} en stock`,
    }));

  return {
    fallidas,
    vista: {
      alcance: "Estado actual del catálogo. \"Con stock sin ventas\" usa las ventas del período.",
      kpis: [
        { titulo: "Sin stock", tono: "alerta", valor: stock ? controlados.filter((p) => p.sin_stock).length : null },
        { titulo: "Stock bajo", tono: "aviso", detalle: "Todavía con unidades", valor: stock ? controlados.filter((p) => p.stock_bajo && !p.sin_stock).length : null },
        { titulo: "Con stock sin ventas", valor: indicador(situacion, TEXTOS_SQL.indicadorStockSinVentas) },
        { titulo: "Valor del inventario", tipo: "moneda", detalle: "Stock × precio de venta, no costo",
          valor: stock ? controlados.reduce((s, p) => s + Math.max(numero(p.stock_prod), 0) * precioEfectivo(p), 0) : null },
      ],
      graficos: [
        { titulo: "Reponer primero", nota: "Días de cobertura", vista: "lista", formato: "dias", puntos: stock ? reponer : null, vacio: "No hay productos con stock bajo." },
        { titulo: "Productos por situación", vista: "barras", puntos: situacion ? agrupar(situacion.datos, "situacion") : null },
      ],
      enlace: { texto: "Ver reporte de inventario", ruta: "/admin/reportes?tipo=inventario" },
    },
  };
}

async function cargarAprobaciones(ctx) {
  const { datos, fallidas } = await cargarVarias({ conteos: consulta.aprobaciones(ctx) });
  const c = datos.conteos;

  return {
    fallidas,
    vista: {
      alcance: "Estado actual: lo que bodega envió y espera revisión.",
      kpis: [
        { titulo: "Productos por aprobar", tono: "aviso", valor: c?.productos ?? null },
        { titulo: "Marcas por aprobar", tono: "aviso", valor: c?.marcas ?? null },
        { titulo: "Cambios sin revisar", valor: c?.cambios ?? null },
        { titulo: "Total por revisar", valor: c ? c.productos + c.marcas + c.cambios : null },
      ],
      graficos: [
        { titulo: "Pendientes por tipo", vista: "anillo",
          puntos: c ? [{ etiqueta: "Productos", valor: c.productos }, { etiqueta: "Marcas", valor: c.marcas }, { etiqueta: "Cambios", valor: c.cambios }] : null },
      ],
      enlace: { texto: "Ir a Aprobaciones", ruta: "/admin/aprobaciones" },
    },
  };
}

async function cargarClientes(ctx) {
  const { datos, fallidas } = await cargarVarias({
    clientes: () => ctx.llamar("reporte_clientes_admin", { p_desde: ctx.desde, p_hasta: ctx.hasta }),
    registrados: () => ctx.contar("clientes-registrados", "usuario", (q) => q.eq("rol_user", ROL.CLIENTE)),
  });
  const { clientes, registrados } = datos;
  const filas = lista(clientes);
  const compradores = filas.filter((f) => numero(f.pedidos) > 0);

  return {
    fallidas,
    vista: {
      alcance: "Clientes que compraron, cotizaron o se registraron en el período.",
      kpis: [
        { titulo: "Clientes registrados", valor: registrados, detalle: "Total histórico" },
        { titulo: "Clientes nuevos", valor: clientes ? filas.filter((f) => f.cliente_nuevo).length : null },
        { titulo: "Clientes que compraron", valor: clientes ? compradores.length : null },
        { titulo: "Pidieron cotización", valor: clientes ? filas.filter((f) => numero(f.cotizaciones) > 0).length : null },
      ],
      graficos: [
        { titulo: "Top 5 clientes por monto", vista: "barras", formato: "moneda",
          puntos: clientes
            ? [...compradores].sort((x, y) => numero(y.total_comprado) - numero(x.total_comprado)).slice(0, 5)
                .map((f) => ({ etiqueta: f.cliente || "Sin nombre", valor: numero(f.total_comprado) }))
            : null },
        { titulo: "Compradores por comuna", vista: "barras",
          puntos: clientes ? limitarGrupos(agrupar(compradores, "comuna", undefined, { vacio: "Sin comuna" }), 6) : null },
      ],
      enlace: { texto: "Ver reporte de clientes", ruta: "/admin/reportes?tipo=clientes" },
    },
  };
}

async function cargarEquipo(ctx) {
  const { desde, hasta } = ctx;
  const { datos, fallidas } = await cargarVarias({
    integrantes: () =>
      ctx.unaVez("integrantes", async () => {
        const { data, error } = await supabase
          .from("usuario")
          .select("id_user, nom_user, rol_user, est_user")
          .in("rol_user", [ROL.ADMINISTRADOR, ROL.BODEGUERO])
          .order("nom_user", { ascending: true });
        if (error) throw error;
        return data ?? [];
      }),
    pedidos: consulta.pedidosActuales(ctx),
    // Cambios de catálogo enviados por el equipo (se filtran por fecha abajo)
    cambios: () =>
      ctx.unaVez(`cambios:${desde}`, async () => {
        const { data, error } = await supabase
          .from("producto_cambio")
          .select("id_user, fecha_cambio, revisado")
          .not("id_user", "is", null)
          .gte("fecha_cambio", `${sumarDias(desde, -1)}T00:00:00Z`);
        if (error) throw error;
        return data ?? [];
      }),
  });
  const { integrantes, pedidos, cambios } = datos;

  const personas = lista(integrantes);
  const activos = personas.filter((p) => p.est_user);
  const esRol = (rol) => (p) => numero(p.rol_user) === rol;
  const entregados = lista(pedidos).filter((p) => esFinalizado(p) && p.id_bodeguero && estaEnRango(p.fecha_pedido, desde, hasta));
  const enPreparacion = lista(pedidos).filter((p) => Number(p.id_estado) === ESTADO_PEDIDO.PREPARACION && p.id_bodeguero);
  const listos = lista(pedidos).filter((p) => esListo(p) && p.id_bodeguero);
  const cambiosPeriodo = lista(cambios).filter((c) => estaEnRango(c.fecha_cambio, desde, hasta));
  const sinRevisar = cambiosPeriodo.filter((c) => !c.revisado);

  // Cuenta por persona: Map id_user → cantidad
  const porPersona = (filas, campo) =>
    filas.reduce((mapa, fila) => mapa.set(fila[campo], (mapa.get(fila[campo]) ?? 0) + 1), new Map());
  const entregadosPorId = porPersona(entregados, "id_bodeguero");
  const preparandoPorId = porPersona(enPreparacion, "id_bodeguero");
  const listosPorId = porPersona(listos, "id_bodeguero");
  const cambiosPorId = porPersona(cambiosPeriodo, "id_user");
  const sinRevisarPorId = porPersona(sinRevisar, "id_user");

  const nombreDe = (id) => personas.find((p) => p.id_user === id)?.nom_user ?? "Sin nombre";
  const ranking = (mapa) => [...mapa].map(([id, valor]) => ({ etiqueta: nombreDe(id), valor })).sort((a, b) => b.valor - a.valor);

  // Una fila por persona: bodegueros primero, luego por pedidos entregados
  const detalle = personas
    .map((p) => ({
      id: p.id_user,
      nombre: p.nom_user || "Sin nombre",
      rol: esRol(ROL.ADMINISTRADOR)(p) ? "Administrador" : "Bodeguero",
      estado: p.est_user ? "Activa" : "Inactiva",
      entregados: entregadosPorId.get(p.id_user) ?? 0,
      preparando: preparandoPorId.get(p.id_user) ?? 0,
      listos: listosPorId.get(p.id_user) ?? 0,
      cambios: cambiosPorId.get(p.id_user) ?? 0,
      sinRevisar: sinRevisarPorId.get(p.id_user) ?? 0,
    }))
    .sort((a, b) => (a.rol === b.rol ? b.entregados - a.entregados || a.nombre.localeCompare(b.nombre, "es") : a.rol === "Bodeguero" ? -1 : 1));

  return {
    fallidas,
    vista: {
      alcance: "Cuentas y pedidos en curso: estado actual. Entregados y cambios de catálogo: del período elegido.",
      kpis: [
        { titulo: "Equipo activo", valor: integrantes ? activos.length : null,
          detalle: integrantes
            ? `${cantidad(activos.filter(esRol(ROL.ADMINISTRADOR)).length, "administrador", "administradores")} y ${cantidad(activos.filter(esRol(ROL.BODEGUERO)).length, "bodeguero", "bodegueros")}`
            : undefined },
        { titulo: "Cuentas inactivas", valor: integrantes ? personas.length - activos.length : null },
        { titulo: "Pedidos entregados", valor: pedidos ? entregados.length : null, detalle: "Pedidos del período ya finalizados" },
                { titulo: "Cambios sin revisar", tono: "aviso", valor: cambios ? sinRevisar.length : null, detalle: "Enviados en el período" },
        { titulo: "Listos por entregar", tono: "aviso", valor: pedidos ? listos.length : null, detalle: "Preparados, aún sin finalizar" },
        { titulo: "Cambios de catálogo", valor: cambios ? cambiosPeriodo.length : null,
          detalle: cambios ? cantidad(sinRevisar.length, "sin revisar", "sin revisar") : undefined },
      ],
      graficos: [
        { titulo: "Pedidos entregados por bodeguero", vista: "barras", puntos: pedidos && integrantes ? ranking(entregadosPorId) : null },
        { titulo: "Cambios de catálogo por persona", nota: "Enviados a revisión", vista: "barras",
          puntos: cambios && integrantes ? ranking(cambiosPorId) : null },
        { titulo: "Detalle por persona", vista: "tabla", ancho: true, vacio: "No hay cuentas del equipo.",
          puntos: integrantes ? detalle : null,
          columnas: [
            { c: "nombre", t: "Nombre" },
            { c: "rol", t: "Rol" },
            { c: "estado", t: "Cuenta", insignia: true },
            { c: "entregados", t: "Pedidos entregados", tipo: "numero" },
            { c: "preparando", t: "En preparación", tipo: "numero" },
            { c: "listos", t: "Listos por entregar", tipo: "numero" },
            { c: "cambios", t: "Cambios enviados", tipo: "numero" },
            { c: "sinRevisar", t: "Sin revisar", tipo: "numero" },
          ] },
      ],
      enlace: { texto: "Ir a Usuarios", ruta: "/admin/usuarios" },
    },
  };
}

// Secciones en el orden en que aparecen en la página
const SECCIONES = [
  { id: "resumen", texto: "Resumen", cargar: cargarResumen },
  { id: "pedidos", texto: "Pedidos", cargar: cargarPedidos },
  { id: "pagos", texto: "Pagos", cargar: cargarPagos },
  { id: "cotizaciones", texto: "Cotizaciones", cargar: cargarCotizaciones },
  { id: "inventario", texto: "Inventario", cargar: cargarInventario },
  { id: "aprobaciones", texto: "Aprobaciones", cargar: cargarAprobaciones },
  { id: "clientes", texto: "Clientes", cargar: cargarClientes },
  { id: "equipo", texto: "Equipo", cargar: cargarEquipo },
];

// =====================================================================
// GRÁFICOS NATIVOS (SVG y CSS)
// =====================================================================

const hayDatos = (puntos) => Array.isArray(puntos) && puntos.some((p) => Number(p.valor) > 0 || Number(p.anterior) > 0);

function SinDatos({ texto = "Sin datos en este período." }) {
  return <p className="pa-vacio">{texto}</p>;
}

function TarjetaKpi({ titulo, valor, tipo = "numero", anterior, menosEsMejor = false, detalle, tono }) {
  const comparacion = textoVariacion(valor, anterior, tipo);
  const tonoCambio = tonoVariacion(valor, anterior, menosEsMejor);

  return (
    <article className="pa-kpi">
      <p className="pa-kpi__titulo">{titulo}</p>
      <p className={`pa-kpi__valor ${tono && Number(valor) > 0 ? `es-${tono}` : ""}`}>{formatearValor(tipo, valor)}</p>
      {comparacion && <p className={`pa-kpi__cambio ${tonoCambio ? `es-${tonoCambio}` : ""}`}>{comparacion}</p>}
      {detalle && <p className="pa-kpi__detalle">{detalle}</p>}
    </article>
  );
}

// Tope "redondo" para el eje: 1, 2, 2,5 o 5 × potencia de 10
function maximoRedondo(valor) {
  if (valor <= 0) return 1;
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const paso = [1, 2, 2.5, 5, 10].find((f) => f * potencia >= valor / 4) * potencia;
  return Math.ceil(valor / paso) * paso;
}

// Columnas por día + línea punteada del período anterior (si viene "anterior" en los puntos)
function GraficoColumnas({ puntos, formato = "moneda" }) {
  if (!hayDatos(puntos)) return <SinDatos />;

  const ancho = 720;
  const alto = 210;
  const m = { arriba: 10, derecha: 8, abajo: 26, izquierda: 52 };
  const areaAlto = alto - m.arriba - m.abajo;
  const paso = (ancho - m.izquierda - m.derecha) / puntos.length;
  const anchoBarra = Math.max(2, Math.min(28, paso * 0.7));
  const conAnterior = puntos.some((p) => p.anterior != null);
  const maximo = maximoRedondo(Math.max(...puntos.flatMap((p) => [numero(p.valor), numero(p.anterior)])));
  const y = (valor) => m.arriba + areaAlto - (valor / maximo) * areaAlto;
  const centro = (i) => m.izquierda + paso * i + paso / 2;
  const etiquetaEje = (valor) => `${formato === "moneda" ? "$" : ""}${formatoCompacto.format(valor)}`;
  const indicesFecha = [...new Set([0, Math.floor((puntos.length - 1) / 2), puntos.length - 1])];
  const linea = puntos
    .map((p, i) => (p.anterior == null ? null : `${centro(i)},${y(numero(p.anterior))}`))
    .filter(Boolean)
    .join(" ");

  return (
    <>
      {conAnterior && (
        <div className="pa-leyenda" aria-hidden="true">
          <span><i className="pa-leyenda__barra" /> Este período</span>
          <span><i className="pa-leyenda__linea" /> Período anterior</span>
        </div>
      )}
      <svg className="pa-columnas" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={`Gráfico de columnas con ${puntos.length} días`}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraccion) => (
          <g key={fraccion}>
            <line x1={m.izquierda} x2={ancho - m.derecha} y1={y(fraccion * maximo)} y2={y(fraccion * maximo)} className="pa-columnas__guia" />
            <text x={m.izquierda - 8} y={y(fraccion * maximo) + 4} textAnchor="end" className="pa-columnas__eje">
              {etiquetaEje(fraccion * maximo)}
            </text>
          </g>
        ))}
        {puntos.map((punto, i) => {
          const valor = numero(punto.valor);
          const pedidos = punto.pedidos == null ? "" : ` · ${cantidad(punto.pedidos, "pedido", "pedidos")}`;
          const antes = punto.anterior == null ? "" : ` · Período anterior: ${formatearValor(formato, punto.anterior)}`;
          return (
            <rect
              key={`${punto.etiqueta}-${i}`}
              x={centro(i) - anchoBarra / 2}
              y={y(valor)}
              width={anchoBarra}
              height={(valor / maximo) * areaAlto}
              rx="3"
              className="pa-columnas__barra"
            >
              <title>{`${etiquetaDia(punto.etiqueta)}: ${formatearValor(formato, valor)}${pedidos}${antes}`}</title>
            </rect>
          );
        })}
        {linea && <polyline points={linea} className="pa-columnas__anterior" />}
        {indicesFecha.map((i) => (
          <text
            key={`x-${i}`}
            x={centro(i)}
            y={alto - 6}
            textAnchor={i === 0 ? "start" : i === puntos.length - 1 ? "end" : "middle"}
            className="pa-columnas__eje"
          >
            {etiquetaDia(puntos[i].etiqueta)}
          </text>
        ))}
      </svg>
    </>
  );
}

function GraficoBarras({ puntos, formato = "numero" }) {
  if (!hayDatos(puntos)) return <SinDatos />;
  const filas = puntos.filter((p) => Number(p.valor) > 0).slice(0, 8);
  const maximo = Math.max(...filas.map((p) => Number(p.valor)));

  return (
    <ul className="pa-barras">
      {filas.map((p) => (
        <li key={p.etiqueta}>
          <div className="pa-barras__texto">
            <span title={p.etiqueta}>
              {p.etiqueta}
              {p.detalle && <small> · {p.detalle}</small>}
            </span>
            <strong>{formatearValor(formato, p.valor)}</strong>
          </div>
          <div className="pa-barras__pista" aria-hidden="true">
            <div className="pa-barras__relleno" style={{ width: `${(Number(p.valor) / maximo) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function GraficoAnillo({ puntos, formato = "numero" }) {
  if (!hayDatos(puntos)) return <SinDatos />;
  const { total, segmentos } = segmentosAnillo(puntos);

  return (
    <div className="pa-anillo">
      <div className="pa-anillo__figura">
        <svg viewBox="0 0 160 160" role="img" aria-label={segmentos.map((s) => `${s.etiqueta}: ${s.valor}`).join(", ")}>
          <circle cx="80" cy="80" r="62" fill="none" stroke="#eef2f7" strokeWidth="20" />
          {segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <circle
                key={s.etiqueta}
                cx="80"
                cy="80"
                r="62"
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                pathLength="100"
                strokeDasharray={`${s.porcentaje} ${100 - s.porcentaje}`}
                strokeDashoffset={-s.offset}
                transform="rotate(-90 80 80)"
              >
                <title>{`${s.etiqueta}: ${formatearValor(formato, s.valor)}`}</title>
              </circle>
            ))}
        </svg>
        <div className="pa-anillo__centro" aria-hidden="true">
          <strong>{formato === "moneda" ? `$${formatoCompacto.format(total)}` : formatearValor("numero", total)}</strong>
          <span>Total</span>
        </div>
      </div>
      <ul className="pa-anillo__leyenda">
        {segmentos.map((s) => (
          <li key={s.etiqueta}>
            <span className="pa-anillo__punto" style={{ background: s.color }} aria-hidden="true" />
            <span className="pa-anillo__nombre">{s.etiqueta}</span>
            <strong>
              {formatearValor(formato, s.valor)}
              <small>{Math.round(s.porcentaje)} %</small>
            </strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaValores({ puntos, formato = "numero", vacio }) {
  if (!Array.isArray(puntos) || puntos.length === 0) return <SinDatos texto={vacio} />;

  return (
    <ol className="pa-lista">
      {puntos.map((p, i) => (
        <li key={`${p.etiqueta}-${i}`}>
          <div>
            <span>{p.etiqueta}</span>
            {p.detalle && <small>{p.detalle}</small>}
          </div>
          <strong>{p.valor == null ? "—" : formatearValor(formato, p.valor)}</strong>
        </li>
      ))}
    </ol>
  );
}

// Tabla de detalle. columnas: [{ c: campo, t: título, tipo?, insignia? }]
function TablaDetalle({ columnas = [], filas, vacio }) {
  if (!Array.isArray(filas) || filas.length === 0) return <SinDatos texto={vacio} />;

  return (
    <div className="pa-tabla-contenedor">
      <table className="pa-tabla">
        <thead>
          <tr>
            {columnas.map((col) => (
              <th key={col.c} scope="col" className={col.tipo ? "es-numero" : ""}>{col.t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={fila.id ?? i}>
              {columnas.map((col) => (
                <td key={col.c} className={col.tipo ? "es-numero" : ""}>
                  {col.insignia ? (
                    <span className={`pa-insignia es-${normalizar(fila[col.c])}`}>{fila[col.c]}</span>
                  ) : col.tipo ? (
                    formatearValor(col.tipo, fila[col.c])
                  ) : (
                    fila[col.c]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Caja con título que dibuja el gráfico según su "vista"
function TarjetaGrafico({ titulo, vista, puntos, formato, vacio, nota, columnas, ancho = false }) {
  let contenido = <GraficoBarras puntos={puntos} formato={formato} />;
  if (puntos === null) contenido = <SinDatos texto="No se pudo cargar esta información." />;
  else if (vista === "columnas") contenido = <GraficoColumnas puntos={puntos} formato={formato} />;
  else if (vista === "anillo") contenido = <GraficoAnillo puntos={puntos} formato={formato} />;
  else if (vista === "lista") contenido = <ListaValores puntos={puntos} formato={formato} vacio={vacio} />;
  else if (vista === "tabla") contenido = <TablaDetalle columnas={columnas} filas={puntos} vacio={vacio} />;

  return (
    <section className={`pa-grafico ${ancho ? "pa-grafico--ancho" : ""}`}>
      <header className="pa-grafico__encabezado">
        <h3>{titulo}</h3>
        {nota && <p>{nota}</p>}
      </header>
      {contenido}
    </section>
  );
}

// Meta de ventas del mes con barra de avance y proyección
function TarjetaMeta({ ventasMes, meta, ahora, onCambiar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");

  const hoy = diaDe(ahora);
  const [anio, mes, dia] = hoy.split("-").map(Number);
  const nombreMes = new Date(Date.UTC(anio, mes - 1, 1)).toLocaleDateString("es-CL", { month: "long", timeZone: "UTC" });
  const diasDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const vendido = numero(ventasMes);
  const avance = meta ? (vendido / meta) * 100 : 0;
  const proyeccion = (vendido / dia) * diasDelMes;

  const abrir = () => {
    setTexto(meta ? String(meta) : "");
    setError("");
    setEditando(true);
  };

  const guardar = (evento) => {
    evento.preventDefault();
    const valor = Math.round(Number(String(texto).replace(/\D/g, "")));
    if (!valor) {
      setError("Ingresa un monto mayor a cero.");
      return;
    }
    onCambiar(valor);
    setEditando(false);
  };

  return (
    <section className="pa-grafico pa-grafico--ancho pa-meta">
      <header className="pa-grafico__encabezado">
        <h3>Meta de ventas de {nombreMes}</h3>
        {!editando && (
          <button type="button" className="pa-boton-texto" onClick={abrir}>
            {meta ? "Cambiar meta" : "Definir meta"}
          </button>
        )}
      </header>

      {editando ? (
        <form className="pa-meta__formulario" onSubmit={guardar} noValidate>
          <label htmlFor="pa-meta-monto">Monto de la meta (CLP)</label>
          <div>
            <input
              id="pa-meta-monto"
              type="text"
              inputMode="numeric"
              placeholder="3000000"
              value={texto}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "pa-meta-error" : undefined}
              onChange={(e) => {
                setTexto(e.target.value);
                setError("");
              }}
            />
            <button type="submit" className="pa-boton">Guardar</button>
            <button type="button" className="pa-boton-texto" onClick={() => setEditando(false)}>Cancelar</button>
            {meta && (
              <button type="button" className="pa-boton-texto" onClick={() => { onCambiar(null); setEditando(false); }}>
                Quitar meta
              </button>
            )}
          </div>
          {error && <p id="pa-meta-error" className="pa-meta__error">{error}</p>}
        </form>
      ) : ventasMes === null ? (
        <SinDatos texto="No se pudo cargar lo vendido este mes." />
      ) : meta ? (
        <>
          <p className="pa-meta__cifras">
            <strong>{formatearValor("moneda", vendido)}</strong> de {formatearValor("moneda", meta)}
          </p>
          <div className="pa-meta__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(avance, 100))} aria-label="Avance de la meta">
            <div className={avance >= 100 ? "es-cumplida" : ""} style={{ width: `${Math.min(avance, 100)}%` }} />
          </div>
          <p className="pa-meta__detalle">
            {avance >= 100 ? "Meta cumplida" : `${formatoNumero.format(avance)} % · faltan ${formatearValor("moneda", meta - vendido)}`}
            {` · Al ritmo actual cerrarías el mes en ${formatearValor("moneda", proyeccion)}`}
          </p>
        </>
      ) : (
        <p className="pa-meta__detalle">
          Vendido este mes: <strong>{formatearValor("moneda", vendido)}</strong>. Define una meta para ver el avance y la proyección.
        </p>
      )}
      <p className="pa-meta__nota">La meta se guarda en este navegador.</p>
    </section>
  );
}

// Bloques grises mientras carga una sección
function Esqueleto() {
  return (
    <div className="pa-esqueleto" aria-hidden="true">
      <div className="pa-kpis">
        {[0, 1, 2, 3].map((i) => <div key={i} className="pa-esqueleto__caja pa-esqueleto__caja--kpi" />)}
      </div>
      <div className="pa-graficos">
        {[0, 1].map((i) => <div key={i} className="pa-esqueleto__caja pa-esqueleto__caja--grafico" />)}
      </div>
    </div>
  );
}

// =====================================================================
// CONTENIDO DE CADA SECCIÓN
// =====================================================================

function ContenidoResumen({ vista, meta, ahora, onCambiarMeta }) {
  const { kpis, ventasMes, ventasDia, topProductos, ventasFamilia, atencion } = vista;

  return (
    <>
      {kpis.length > 0 ? (
        <div className="pa-kpis pa-kpis--seis">
          {kpis.map((kpi) => <TarjetaKpi key={kpi.titulo} {...kpi} />)}
        </div>
      ) : (
        <p className="pa-vacio">No se pudieron cargar los indicadores de ventas.</p>
      )}

      <div className="pa-graficos">
        <TarjetaMeta ventasMes={ventasMes} meta={meta} ahora={ahora} onCambiar={onCambiarMeta} />
        <TarjetaGrafico ancho titulo="Ventas por día" nota="Pedidos con pago autorizado" vista="columnas" formato="moneda" puntos={ventasDia} />
        <TarjetaGrafico titulo="Top 5 productos por monto" vista="barras" formato="moneda" puntos={topProductos} />
        <TarjetaGrafico titulo="Ventas por familia" vista="anillo" formato="moneda" puntos={ventasFamilia} />
      </div>

      <h3 className="pa-subtitulo">Requiere atención</h3>
      <div className="pa-atencion">
        {atencion.map(({ titulo, valor, detalle, tono, ruta, Icono }) => (
          <Link key={titulo} to={ruta} className={`pa-atencion__item ${Number(valor) > 0 ? `es-${tono}` : ""}`}>
            <span className="pa-atencion__icono" aria-hidden="true"><Icono /></span>
            <span className="pa-atencion__texto">
              <strong>{formatearValor("numero", valor)}</strong>
              <span>{titulo}</span>
              {detalle && <small>{detalle}</small>}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}

function ContenidoApartado({ vista }) {
  const { kpis, graficos } = vista;

  return (
    <>
      {kpis.length > 0 && (
        <div className={`pa-kpis ${kpis.length === 6 ? "pa-kpis--seis" : ""}`}>
          {kpis.map((kpi) => <TarjetaKpi key={kpi.titulo} {...kpi} />)}
        </div>
      )}
      <div className={`pa-graficos ${graficos.length === 1 ? "pa-graficos--uno" : ""}`}>
        {graficos.map((grafico) => <TarjetaGrafico key={grafico.titulo} {...grafico} />)}
      </div>
    </>
  );
}

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================

function AdminDashboard() {
  const [periodo, setPeriodo] = useState("30d");
  const [recargas, setRecargas] = useState(0);
  const [ahora, setAhora] = useState(() => Date.now());
  const [secciones, setSecciones] = useState({});
  const [activa, setActiva] = useState(SECCIONES[0].id);
  const [meta, setMeta] = useState(leerMeta);

  const hoy = diaDe(ahora);
  const [desde, hasta] = useMemo(() => rangoPeriodo(periodo, hoy), [periodo, hoy]);
  const clave = `${desde}|${hasta}|${recargas}`;

  // Carga todas las secciones a la vez; cada una aparece apenas llega
  useEffect(() => {
    let vigente = true;
    const ctx = crearContexto({ desde, hasta, hoy });

    SECCIONES.forEach((seccion) => {
      seccion
        .cargar(ctx)
        .then(({ vista, fallidas }) => ({ vista, fallidas, error: "" }))
        .catch((error) => {
          console.error(`Error al cargar la sección "${seccion.id}":`, { codigo: error?.code, estado: error?.status });
          return { vista: null, fallidas: [], error: "No fue posible cargar esta sección." };
        })
        .then((respuesta) => {
          if (vigente) setSecciones((previo) => ({ ...previo, [seccion.id]: { ...respuesta, clave, cargadoEn: Date.now() } }));
        });
    });

    return () => {
      vigente = false;
    };
  }, [clave, desde, hasta, hoy]);

  // Reloj para "Actualizado hace…" y actualización automática cada 5 minutos
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 30000);
    const automatico = setInterval(() => {
      if (!document.hidden) setRecargas((n) => n + 1);
    }, AUTO_ACTUALIZAR_MS);
    return () => {
      clearInterval(reloj);
      clearInterval(automatico);
    };
  }, []);

  // Marca en la barra la sección que se está viendo al hacer scroll
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observador = new IntersectionObserver(
      (entradas) => {
        const visible = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiva(visible.target.dataset.seccion);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    SECCIONES.forEach((s) => {
      const elemento = document.getElementById(`pa-${s.id}`);
      if (elemento) observador.observe(elemento);
    });
    return () => observador.disconnect();
  }, []);

  const estados = SECCIONES.map((s) => secciones[s.id]).filter(Boolean);
  const cargando = SECCIONES.some((s) => secciones[s.id]?.clave !== clave);
  const ultimaCarga = estados.length ? Math.max(...estados.map((e) => e.cargadoEn)) : null;
  const sinPermiso = estados.some((e) => e.fallidas.some((f) => f.codigo === "42501"));

  const recargar = () => setRecargas((n) => n + 1);
  const cambiarMeta = (valor) => {
    guardarMeta(valor);
    setMeta(valor);
  };

  // Lleva a la sección con un desplazamiento suave
  const irA = (evento, id) => {
    evento.preventDefault();
    setActiva(id);
    const sinMovimiento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`pa-${id}`)?.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "start" });
  };

  return (
    <section className="admin-page panel-admin">
      <AdminHeader titulo="Panel de administración" descripcion="Indicadores clave del negocio y de cada área de la página." />

      <div className="pa-barra">
        <div className="pa-barra__fila">
          <nav className="pa-secciones-nav" aria-label="Secciones del panel">
            {SECCIONES.map((s) => (
              <a
                key={s.id}
                href={`#pa-${s.id}`}
                className={activa === s.id ? "es-activa" : ""}
                aria-current={activa === s.id ? "true" : undefined}
                onClick={(evento) => irA(evento, s.id)}
              >
                {s.texto}
              </a>
            ))}
          </nav>
          <div className="pa-periodos" role="group" aria-label="Período">
            {PERIODOS.map((p) => (
              <button key={p.id} type="button" aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)}>
                {p.texto}
              </button>
            ))}
            <button type="button" className="pa-actualizar" onClick={recargar} disabled={cargando} aria-label="Actualizar datos">
              <LuRotateCcw aria-hidden="true" /> Actualizar
            </button>
          </div>
        </div>
        <p className="pa-rango">
          Del {etiquetaDia(desde)} al {etiquetaDia(hasta)}
          {" · "}
          {cargando ? (estados.length ? "actualizando…" : "cargando…") : textoActualizado(ultimaCarga, ahora)}
        </p>
      </div>

      {sinPermiso && (
        <div className="admin-message admin-message--error" role="alert">
          <p>Tu usuario no tiene permisos de administrador para ver estos indicadores.</p>
        </div>
      )}

      <div className="pa-secciones">
        {SECCIONES.map((s) => {
          const estado = secciones[s.id];
          const vista = estado?.vista;
          const desactualizada = estado && estado.clave !== clave;
          const avisoParcial = !sinPermiso && estado?.fallidas.length > 0;

          return (
            <section key={s.id} id={`pa-${s.id}`} data-seccion={s.id} className="pa-seccion" aria-labelledby={`pa-titulo-${s.id}`}>
              <header className="pa-seccion__encabezado">
                <div>
                  <h2 id={`pa-titulo-${s.id}`}>{s.texto}</h2>
                  {vista?.alcance && <p>{vista.alcance}</p>}
                </div>
                {vista?.enlace && <Link className="pa-enlace" to={vista.enlace.ruta}>{vista.enlace.texto} →</Link>}
              </header>

              {sinPermiso ? null : estado?.error ? (
                <div className="pa-aviso" role="alert">
                  <span>{estado.error}</span>
                  <button type="button" onClick={recargar}><LuRotateCcw aria-hidden="true" /> Reintentar</button>
                </div>
              ) : !vista ? (
                <Esqueleto />
              ) : (
                <div className={`pa-contenido ${desactualizada ? "esta-actualizando" : ""}`}>
                  {avisoParcial && (
                    <div className="pa-aviso" role="status">
                      <span>Parte de esta sección no se pudo cargar.</span>
                      <button type="button" onClick={recargar}><LuRotateCcw aria-hidden="true" /> Reintentar</button>
                    </div>
                  )}
                  {s.id === "resumen" ? (
                    <ContenidoResumen vista={vista} meta={meta} ahora={ahora} onCambiarMeta={cambiarMeta} />
                  ) : (
                    <ContenidoApartado vista={vista} />
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default AdminDashboard;