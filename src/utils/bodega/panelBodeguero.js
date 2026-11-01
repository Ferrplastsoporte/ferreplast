// Cálculos del dashboard del bodeguero.
// Recibe lo que devuelve la RPC reporte_dashboard_bodeguero y arma
// los números de las tarjetas y los datos de cada gráfico.

export const ESTADO = {
  CONFIRMADO: 1,
  PREPARACION: 2,
  LISTO_DESPACHO: 3,
  LISTO_RETIRO: 4,
  FINALIZADO: 5,
};

export const ENTREGAS = {
  retiro: { label: "Retiro en tienda", corto: "Retiro", color: "#2563eb" },
  despacho: { label: "Despacho a domicilio", corto: "Despacho", color: "#f97316" },
  coordinar: { label: "Por coordinar", corto: "Por coordinar", color: "#14b8a6" },
};

export const ESTADOS_GRAFICO = [
  { id: ESTADO.CONFIRMADO, label: "Confirmado", color: "#f59e0b", filtro: "pendientes" },
  { id: ESTADO.PREPARACION, label: "En preparación", color: "#2563eb", filtro: "pendientes" },
  { id: ESTADO.LISTO_DESPACHO, label: "Listo para despacho", color: "#8b5cf6", filtro: "listos" },
  { id: ESTADO.LISTO_RETIRO, label: "Listo para retiro", color: "#14b8a6", filtro: "listos" },
  { id: ESTADO.FINALIZADO, label: "Finalizado", color: "#94a3b8", filtro: "finalizados" },
];

// Antigüedad de los pendientes en horas hábiles (lun a vie, 10:00 a 17:30)
export const TRAMOS_ANTIGUEDAD = [
  { id: "t1", label: "Menos de 4 h", min: 0, max: 4, color: "#16a34a" },
  { id: "t2", label: "4 a 8 h", min: 4, max: 8, color: "#f59e0b" },
  { id: "t3", label: "8 a 24 h", min: 8, max: 24, color: "#f97316" },
  { id: "t4", label: "Más de 24 h", min: 24, max: Infinity, color: "#dc2626" },
];

// Mismo criterio que la página de Pedidos: 24 horas corridas desde el pago
export const HORAS_ATRASO = 24;

const formatoDia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" });
const formatoHora = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santiago",
  hour: "2-digit",
  hourCycle: "h23",
});
const formatoNumero = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

export const numero = (valor) => formatoNumero.format(Number(valor) || 0);

export function fechaCorta(fecha) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function etiquetaDia(iso) {
  const [, mes, dia] = iso.split("-");
  return `${Number(dia)}/${Number(mes)}`;
}

// Fechas YYYY-MM-DD (hora de Chile) desde hace n-1 días hasta hoy
export function diasDelRango(n) {
  const hoy = Date.now();
  return Array.from({ length: n }, (_, i) =>
    formatoDia.format(new Date(hoy - (n - 1 - i) * 86400000)),
  );
}

export function contarPorEntrega(lista) {
  return lista.reduce(
    (acc, pedido) => {
      acc[pedido.entrega] = (acc[pedido.entrega] ?? 0) + 1;
      return acc;
    },
    { retiro: 0, despacho: 0, coordinar: 0 },
  );
}

// Para "Hoy": una barra por hora. Muestra al menos de 9:00 a 18:00
// y se amplía si hay pedidos fuera de ese horario.
export function agruparHoras(dia, pedidos) {
  const horas = pedidos.map((p) => p.hora).filter((h) => h !== null);
  const inicio = Math.min(9, ...horas);
  const fin = Math.max(18, ...horas);

  return Array.from({ length: fin - inicio + 1 }, (_, i) => ({
    label: `${inicio + i}:00`,
    dias: [dia],
    hora: inicio + i,
  }));
}

export function agruparDias(dias, modo) {
  if (modo !== "semana") {
    return dias.map((dia) => ({ label: etiquetaDia(dia), dias: [dia] }));
  }

  const grupos = [];
  for (let fin = dias.length; fin > 0; fin -= 7) {
    const tramo = dias.slice(Math.max(0, fin - 7), fin);
    grupos.unshift({ label: `Sem ${etiquetaDia(tramo[0])}`, dias: tramo });
  }
  return grupos;
}

export function calcularDashboard(datos) {
  const pedidos = (datos?.pedidos ?? []).map((p) => ({
    ...p,
    hora: p.fecha_pago ? Number(formatoHora.format(new Date(p.fecha_pago))) : null,
  }));
  const dias = diasDelRango(datos?.dias ?? 14);
  const desde = dias[0];

  const pedidosDelRango = pedidos.filter((p) => p.dia >= desde);

  const pendientes = pedidos.filter(
    (p) => p.estado === ESTADO.CONFIRMADO || p.estado === ESTADO.PREPARACION,
  );

  const atrasados = pendientes
    .filter((p) => Number(p.horas_espera) >= HORAS_ATRASO)
    .sort((a, b) => b.horas_espera - a.horas_espera);

  const listos = pedidos.filter(
    (p) => p.estado === ESTADO.LISTO_DESPACHO || p.estado === ESTADO.LISTO_RETIRO,
  );

  const finalizados = pedidosDelRango.filter((p) => p.estado === ESTADO.FINALIZADO);
  const finalizadosAnterior = Number(datos?.finalizados_anterior ?? 0);
  const variacionFinalizados =
    finalizadosAnterior > 0
      ? Math.round(((finalizados.length - finalizadosAnterior) / finalizadosAnterior) * 100)
      : null;

  const menosVendidos = datos?.menos_vendidos ?? [];
  // Productos sin ventas en el rango y con stock, de más a menos unidades guardadas
  const sinVentas = menosVendidos
    .filter((p) => Number(p.unidades) === 0 && Number(p.stock) > 0)
    .sort((a, b) => Number(b.stock) - Number(a.stock));

  // Pedidos por día (y por hora, para "Hoy") según tipo de entrega
  const porDia = {};
  const porHora = {};
  pedidosDelRango.forEach((p) => {
    porDia[p.dia] ??= { retiro: 0, despacho: 0, coordinar: 0 };
    porDia[p.dia][p.entrega] += 1;

    if (p.hora !== null) {
      porHora[p.hora] ??= { retiro: 0, despacho: 0, coordinar: 0 };
      porHora[p.hora][p.entrega] += 1;
    }
  });

  // Antigüedad de los pendientes
  const antiguedad = TRAMOS_ANTIGUEDAD.map((tramo) => ({
    ...tramo,
    pedidos: pendientes
      .filter((p) => {
        const horas = Number(p.horas_habiles) || 0;
        return horas >= tramo.min && horas < tramo.max;
      })
      .sort((a, b) => b.horas_habiles - a.horas_habiles),
  }));

  return {
    dias,
    desde,
    pedidos,
    pedidosDelRango,
    pendientes,
    pendientesPorEntrega: contarPorEntrega(pendientes),
    masAntiguo: pendientes[0] ?? null,
    atrasados,
    porcentajeAtrasados: pendientes.length
      ? Math.round((atrasados.length / pendientes.length) * 100)
      : 0,
    listos,
    listosPorEntrega: contarPorEntrega(listos),
    finalizados,
    finalizadosPorEntrega: contarPorEntrega(finalizados),
    variacionFinalizados,
    unidadesPorPreparar: pendientes.reduce((s, p) => s + Number(p.unidades || 0), 0),
    menosVendidos,
    sinVentas,
    sinVentasTotal: Number(datos?.sin_ventas_total ?? sinVentas.length),
    sinStock: datos?.sin_stock ?? [],
    critico: datos?.critico ?? [],
    umbralCritico: Number(datos?.umbral_critico ?? 5),
    topProductos: datos?.top_productos ?? [],
    esHoy: dias.length === 1,
    porDia,
    porHora,
    antiguedad,
  };
}