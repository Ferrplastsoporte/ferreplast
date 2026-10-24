import { lazy } from "react";

// Cada componente abre el mismo bloque; el navegador descarga la sección una sola vez.
export const AdministradorLayout = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.AdministradorLayout }))
);

export const AdminDashboard = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.AdminDashboard }))
);

export const CrearUsuario = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.CrearUsuario }))
);

export const Usuarios = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Usuarios }))
);

export const Pedidos = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Pedidos }))
);

export const Configuracion = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Configuracion }))
);

// Reportes se descarga aparte, únicamente cuando se abre esta opción.
export const Reportes = lazy(() =>
  import("../../pages/admin/reportes")
);

export const Aprobaciones = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Aprobaciones }))
);

export const Pagos = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Pagos }))
);

export const Cotizaciones = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Cotizaciones }))
);

export const Auditoria = lazy(() =>
  import("./SeccionAdministrador").then((seccion) => ({ default: seccion.Auditoria }))
);
