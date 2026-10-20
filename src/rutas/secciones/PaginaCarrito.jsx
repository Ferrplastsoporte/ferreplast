import { lazy } from "react";

// Solo la página del carrito se difiere; los botones para agregar siguen disponibles.
const Carrito = lazy(() => import("../../pages/Cliente/Carrito"));

export default Carrito;
