export const LIMITE_STOCK_BAJO = 10;

export function obtenerResumenBodega(productos = []) {
  const activos = productos.filter(
    (producto) => Number(producto.est_prod) === 2,
  );

  const pendientes = productos.filter(
    (producto) => Number(producto.est_prod) === 1,
  );

  const noDisponibles = productos.filter(
    (producto) => Number(producto.est_prod) === 3,
  );

  const stockBajo = activos.filter(
    (producto) => Number(producto.stock_prod) < LIMITE_STOCK_BAJO,
  );

  return {
    total: productos.length,
    activos: activos.length,
    pendientes: pendientes.length,
    noDisponibles: noDisponibles.length,
    stockBajo: stockBajo.length,
  };
}

export function obtenerPorcentajesEstados(resumen) {
  const total = resumen.activos + resumen.pendientes + resumen.noDisponibles;

  if (total === 0) {
    return {
      activos: 0,
      pendientes: 0,
      noDisponibles: 0,
    };
  }

  return {
    activos: (resumen.activos / total) * 100,
    pendientes: (resumen.pendientes / total) * 100,
    noDisponibles: (resumen.noDisponibles / total) * 100,
  };
}

export function obtenerUltimosProductos(productos = [], limite = 5) {
  return productos.slice(0, limite);
}
