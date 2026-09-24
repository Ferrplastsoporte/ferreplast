import { TASA_IVA } from "../comunes/impuestos";

export const PERIODO_HISTORICO = "historico";

const ESTADOS_COTIZACION = {
  1: { nombre: "Pendiente", clase: "pendiente" },
  2: { nombre: "Completada", clase: "completada" },
  3: { nombre: "Fallida", clase: "fallida" },
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
    timeZone: "America/Santiago",
  }).format(new Date(fecha));
}

export function obtenerPeriodoCotizacion(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    timeZone: "America/Santiago",
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

export function calcularTotalesCotizacion(detalles = [], precios = {}) {
  const subtotal = detalles.reduce((total, detalle) => {
    const precioUnitario = Number(precios[detalle.id_detalle_cot]) || 0;
    return total + precioUnitario * Number(detalle.cantidad || 0);
  }, 0);
  const iva = Math.round(subtotal * TASA_IVA);

  return { subtotal, iva, total: subtotal + iva };
}
