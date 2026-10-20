import { lazy } from "react";

// Cada componente abre el mismo bloque; el navegador descarga la sección una sola vez.
export const BodegueroLayout = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroLayout }))
);

export const BodegueroDashboard = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroDashboard }))
);

export const BodegueroProductos = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroProductos }))
);

export const BodegueroStock = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroStock }))
);

export const BodegueroSolicitudes = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroSolicitudes }))
);

export const BodegueroFamilias = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroFamilias }))
);

export const BodegueroMarcas = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroMarcas }))
);

export const BodegueroUnidades = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroUnidades }))
);

export const BodegueroDocumentos = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroDocumentos }))
);

export const BodegueroPedidos = lazy(() =>
  import("./SeccionBodega").then((seccion) => ({ default: seccion.BodegueroPedidos }))
);
