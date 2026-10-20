import { lazy } from "react";

// Cada componente abre el mismo bloque; el navegador descarga la sección una sola vez.
export const Cotizacion = lazy(() =>
  import("./SeccionCliente").then((seccion) => ({ default: seccion.Cotizacion }))
);

export const PedidosCliente = lazy(() =>
  import("./SeccionCliente").then((seccion) => ({ default: seccion.PedidosCliente }))
);

export const Cuenta = lazy(() =>
  import("./SeccionCliente").then((seccion) => ({ default: seccion.Cuenta }))
);

export const DetallePedido = lazy(() =>
  import("./SeccionCliente").then((seccion) => ({ default: seccion.DetallePedido }))
);

export const PagoResultado = lazy(() =>
  import("./SeccionCliente").then((seccion) => ({ default: seccion.PagoResultado }))
);
