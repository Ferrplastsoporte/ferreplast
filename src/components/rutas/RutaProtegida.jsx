import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAutenticacion } from "../../hooks/useAutenticacion";
import {
  estaAutorizadoPorRol,
  obtenerRutaInicialPorRol,
} from "../../utils/autorizacion";
import EstadoCargaRuta from "./EstadoCargaRuta";

function RutaProtegida({ rolesPermitidos = [] }) {
  const ubicacion = useLocation();

  const {
    initializing,
    isAuthenticated,
    isActive,
    role,
  } = useAutenticacion();

  if (initializing) {
    return <EstadoCargaRuta />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ desde: ubicacion.pathname }}
      />
    );
  }

  if (!isActive) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ cuentaInactiva: true }}
      />
    );
  }

  if (
    rolesPermitidos.length > 0 &&
    !estaAutorizadoPorRol(role, rolesPermitidos)
  ) {
    return <Navigate to={obtenerRutaInicialPorRol(role)} replace />;
  }

  return <Outlet />;
}

export default RutaProtegida;
