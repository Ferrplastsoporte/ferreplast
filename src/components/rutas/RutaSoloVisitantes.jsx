import { Navigate, Outlet } from "react-router-dom";

import { useAutenticacion } from "../../hooks/useAutenticacion";
import { obtenerRutaInicialPorRol } from "../../utils/autorizacion";
import EstadoCargaRuta from "./EstadoCargaRuta";

function RutaSoloVisitantes() {
  const { initializing, isAuthenticated, isActive, role } =
    useAutenticacion();

  if (initializing) {
    return <EstadoCargaRuta />;
  }

  if (isAuthenticated && isActive) {
    return <Navigate to={obtenerRutaInicialPorRol(role)} replace />;
  }

  return <Outlet />;
}

export default RutaSoloVisitantes;
