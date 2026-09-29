export const PERIODO_HISTORICO = "historico";
export const DIAS_VALIDEZ_MINIMOS = 1;
export const DIAS_VALIDEZ_MAXIMOS = 365;
export const TASA_IVA_MINIMA = 0;
export const TASA_IVA_MAXIMA = 100;

const ZONA_HORARIA_CHILE = "America/Santiago";

const ESTADOS_COTIZACION = {
  1: { nombre: "Pendiente", clase: "pendiente" },
  2: { nombre: "Completada", clase: "completada" },
  3: { nombre: "Fallida", clase: "fallida" },
  4: { nombre: "Exitosa", clase: "exitosa" },
};

export function formatearFolioCotizacion(idCotizacion) {
  return `#${idCotizacion ?? ""}`;
}

export function formatearMontoCLP(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

export function formatearFechaCotizacion(fecha, incluirHora = false) {
  if (!fecha) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    ...(incluirHora ? { timeStyle: "short" } : {}),
    timeZone: ZONA_HORARIA_CHILE,
  }).format(new Date(fecha));
}

export function obtenerFechaActualChile() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ZONA_HORARIA_CHILE,
  }).formatToParts(new Date());

  const obtenerParte = (tipo) =>
    partes.find((parte) => parte.type === tipo)?.value;

  return `${obtenerParte("year")}-${obtenerParte("month")}-${obtenerParte("day")}`;
}

export function sumarDiasFecha(fecha, dias) {
  const coincidencia = String(fecha ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  const cantidadDias = Number(dias);

  if (!coincidencia || !Number.isInteger(cantidadDias)) return "";

  const [, anio, mes, dia] = coincidencia.map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia));
  fechaUtc.setUTCDate(fechaUtc.getUTCDate() + cantidadDias);

  return fechaUtc.toISOString().slice(0, 10);
}

export function calcularDiasEntreFechas(fechaInicial, fechaFinal) {
  const inicio = sumarDiasFecha(fechaInicial, 0);
  const fin = sumarDiasFecha(fechaFinal, 0);

  if (!inicio || !fin) return null;

  const milisegundosPorDia = 24 * 60 * 60 * 1000;
  const diferencia =
    (Date.parse(`${fin}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) /
    milisegundosPorDia;

  return Number.isInteger(diferencia) && diferencia >= 0 ? diferencia : null;
}

export function formatearFechaCalendario(fecha) {
  const fechaNormalizada = sumarDiasFecha(fecha, 0);
  if (!fechaNormalizada) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${fechaNormalizada}T00:00:00Z`));
}

export function sanitizarDiasValidez(valor) {
  return String(valor ?? "")
    .replace(/[^0-9]/g, "")
    .slice(0, 3);
}

export function esCantidadDiasValidezValida(valor) {
  const dias = Number(valor);

  return (
    Number.isInteger(dias) &&
    dias >= DIAS_VALIDEZ_MINIMOS &&
    dias <= DIAS_VALIDEZ_MAXIMOS
  );
}

export function normalizarDiasValidezPredeterminados(valor) {
  return esCantidadDiasValidezValida(valor)
    ? Number(valor)
    : null;
}

export function esTasaIvaValida(valor) {
  if (valor === null || valor === undefined || valor === "") return false;

  const tasa = Number(valor);
  return (
    Number.isFinite(tasa) &&
    tasa >= TASA_IVA_MINIMA &&
    tasa <= TASA_IVA_MAXIMA
  );
}

export function normalizarTasaIvaConfigurada(valor) {
  return esTasaIvaValida(valor) ? Number(valor) : null;
}

export function normalizarConfiguracionCotizacion(configuracion) {
  const diasValidez = normalizarDiasValidezPredeterminados(
    configuracion?.dias_validez,
  );
  const tasaIva = normalizarTasaIvaConfigurada(configuracion?.tasa_iva);

  if (diasValidez === null || tasaIva === null) return null;

  return { diasValidez, tasaIva };
}

export function formatearPorcentaje(valor) {
  if (!esTasaIvaValida(valor)) return "—";

  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 2,
  }).format(Number(valor));
}

export function crearMapaDiasValidezCotizaciones(
  cotizaciones = [],
  diasPredeterminados,
) {
  const diasNormalizados = normalizarDiasValidezPredeterminados(
    diasPredeterminados,
  );

  if (diasNormalizados === null) return {};

  return Object.fromEntries(
    cotizaciones.map((cotizacion) => {
      const diasGuardados = calcularDiasEntreFechas(
        cotizacion.fecha_emision,
        cotizacion.fecha_validez,
      );

      return [
        cotizacion.id_cotizacion,
        String(
          esCantidadDiasValidezValida(diasGuardados)
            ? diasGuardados
            : diasNormalizados,
        ),
      ];
    }),
  );
}

export function obtenerPeriodoCotizacion(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: ZONA_HORARIA_CHILE,
  }).formatToParts(new Date(fecha));
  const anio = partes.find((parte) => parte.type === "year")?.value;
  const mes = partes.find((parte) => parte.type === "month")?.value;

  return `${anio}-${mes}`;
}

export function formatearPeriodoCotizacion(periodo) {
  const [anio, mes] = String(periodo).split("-").map(Number);
  if (!anio || !mes) return "Periodo desconocido";

  const texto = new Intl.DateTimeFormat("es-CL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(anio, mes - 1, 1)))
    .replace(" de ", " ");

  return texto.charAt(0).toLocaleUpperCase("es") + texto.slice(1);
}

export function obtenerPeriodosDisponibles(cotizaciones = []) {
  const periodoActual = obtenerPeriodoCotizacion();
  const periodos = new Set([periodoActual]);

  cotizaciones.forEach((cotizacion) => {
    if (cotizacion?.fecha_cot) {
      periodos.add(obtenerPeriodoCotizacion(cotizacion.fecha_cot));
    }
  });

  return [...periodos].sort((a, b) => b.localeCompare(a));
}

export function obtenerEstadoCotizacion(cotizacion) {
  const idEstado = Number(cotizacion?.id_estado_cot);

  return {
    ...(ESTADOS_COTIZACION[idEstado] ?? {
      nombre: "Sin estado",
      clase: "sin-estado",
    }),
    nombre:
      cotizacion?.estado_cotizacion?.nom_estado ||
      ESTADOS_COTIZACION[idEstado]?.nombre ||
      "Sin estado",
  };
}

export function obtenerNombreProductoCotizado(detalle) {
  if (detalle?.es_producto_catalogo) {
    return detalle?.producto?.nom_prod || "Producto del catálogo";
  }

  return detalle?.nom_producto_solicitado || "Producto solicitado";
}

export function sanitizarPrecioCotizacion(valor) {
  return String(valor ?? "")
    .replace(/[^0-9]/g, "")
    .slice(0, 10);
}

export function crearMapaPreciosCotizacion(cotizaciones = []) {
  const precios = {};

  cotizaciones.forEach((cotizacion) => {
    (cotizacion.detalle_cotizacion ?? []).forEach((detalle) => {
      precios[detalle.id_detalle_cot] =
        detalle.valor_bruto === null || detalle.valor_bruto === undefined
          ? ""
          : String(detalle.valor_bruto);
    });
  });

  return precios;
}

export function crearMapaCotizabilidadCotizacion(cotizaciones = []) {
  const cotizabilidad = {};

  cotizaciones.forEach((cotizacion) => {
    (cotizacion.detalle_cotizacion ?? []).forEach((detalle) => {
      cotizabilidad[detalle.id_detalle_cot] = detalle.es_cotizable !== false;
    });
  });

  return cotizabilidad;
}

export function crearMapaNotasCotizaciones(cotizaciones = []) {
  return Object.fromEntries(
    cotizaciones.map((cotizacion) => [
      cotizacion.id_cotizacion,
      String(cotizacion.notas_cotizacion ?? ""),
    ]),
  );
}

export function normalizarNotasCotizacion(valor) {
  return String(valor ?? "").slice(0, 1000);
}

function esDetalleCotizable(detalle, cotizabilidad = {}) {
  const valorLocal = cotizabilidad[detalle.id_detalle_cot];
  return valorLocal === undefined
    ? detalle.es_cotizable !== false
    : Boolean(valorLocal);
}

export function crearPreciosParaCompletarCotizacion(
  detalles = [],
  precios = {},
  cotizabilidad = {},
) {
  if (!Array.isArray(detalles) || detalles.length === 0) return null;

  const preciosNormalizados = detalles.map((detalle) => {
    const esCotizable = esDetalleCotizable(detalle, cotizabilidad);
    if (!esCotizable) {
      return {
        id_detalle_cot: detalle.id_detalle_cot,
        valor_bruto: null,
        es_cotizable: false,
      };
    }

    const valorBruto = Number(precios[detalle.id_detalle_cot]);

    if (!Number.isSafeInteger(valorBruto) || valorBruto <= 0) return null;

    return {
      id_detalle_cot: detalle.id_detalle_cot,
      valor_bruto: valorBruto,
      es_cotizable: true,
    };
  });

  return preciosNormalizados.some((precio) => precio === null)
    ? null
    : preciosNormalizados;
}

export function crearPreciosParaGuardarBorrador(
  detalles = [],
  precios = {},
  cotizabilidad = {},
) {
  if (!Array.isArray(detalles) || detalles.length === 0) return null;

  const preciosNormalizados = detalles.map((detalle) => {
    const esCotizable = esDetalleCotizable(detalle, cotizabilidad);
    if (!esCotizable) {
      return {
        id_detalle_cot: detalle.id_detalle_cot,
        valor_bruto: null,
        es_cotizable: false,
      };
    }

    const valorOriginal = String(precios[detalle.id_detalle_cot] ?? "").trim();

    if (!valorOriginal) {
      return {
        id_detalle_cot: detalle.id_detalle_cot,
        valor_bruto: null,
        es_cotizable: true,
      };
    }

    const valorBruto = Number(valorOriginal);
    if (!Number.isSafeInteger(valorBruto) || valorBruto <= 0) return null;

    return {
      id_detalle_cot: detalle.id_detalle_cot,
      valor_bruto: valorBruto,
      es_cotizable: true,
    };
  });

  return preciosNormalizados.some((precio) => precio === null)
    ? null
    : preciosNormalizados;
}

export function calcularTotalesCotizacion(
  detalles = [],
  precios = {},
  tasaIva,
  cotizabilidad = {},
) {
  const totalBruto = detalles.reduce((total, detalle) => {
    if (!esDetalleCotizable(detalle, cotizabilidad)) return total;

    const precioUnitario = Number(precios[detalle.id_detalle_cot]) || 0;
    return total + precioUnitario * Number(detalle.cantidad || 0);
  }, 0);

  if (!esTasaIvaValida(tasaIva)) {
    return { neto: 0, iva: 0, totalBruto };
  }

  const factorIva = 1 + Number(tasaIva) / 100;
  const neto = Math.round(totalBruto / factorIva);
  const iva = totalBruto - neto;

  return { neto, iva, totalBruto };
}

export function obtenerTotalesCotizacion(
  cotizacion,
  detalles = [],
  precios = {},
  tasaIva,
  cotizabilidad = {},
) {
  const totalesGuardados = {
    neto: Number(cotizacion?.subtotal_neto),
    iva: Number(cotizacion?.monto_iva),
    totalBruto: Number(cotizacion?.total_bruto),
  };
  const tieneTotalesGuardados =
    cotizacion?.subtotal_neto !== null &&
    cotizacion?.subtotal_neto !== undefined &&
    cotizacion?.monto_iva !== null &&
    cotizacion?.monto_iva !== undefined &&
    cotizacion?.total_bruto !== null &&
    cotizacion?.total_bruto !== undefined &&
    Object.values(totalesGuardados).every(
      (valor) => Number.isFinite(valor) && valor >= 0,
    );

  return tieneTotalesGuardados
    ? totalesGuardados
    : calcularTotalesCotizacion(
        detalles,
        precios,
        tasaIva,
        cotizabilidad,
      );
}

export function descargarArchivoDesdeUrl(url, nombreArchivo) {
  if (!url) return false;

  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo || "cotizacion.pdf";
  enlace.rel = "noopener noreferrer";
  enlace.style.display = "none";

  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  return true;
}
