import { lazy } from "react";

// Se solicita el mismo bloque al abrir cualquiera de sus pantallas.
export const Login = lazy(() =>
  import("./SeccionAutenticacion").then((seccion) => ({ default: seccion.Login }))
);

export const Registro = lazy(() =>
  import("./SeccionAutenticacion").then((seccion) => ({ default: seccion.Registro }))
);

export const NuevaContrasena = lazy(() =>
  import("./SeccionAutenticacion").then((seccion) => ({ default: seccion.NuevaContrasena }))
);

export const RecuperarContrasena = lazy(() =>
  import("./SeccionAutenticacion").then((seccion) => ({ default: seccion.RecuperarContrasena }))
);
