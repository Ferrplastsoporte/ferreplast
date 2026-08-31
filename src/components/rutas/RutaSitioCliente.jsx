import { Navigate, Outlet } from "react-router-dom";

import { useAutenticacion } from "../../hooks/useAutenticacion";
import {
  estaAutorizadoPorRol,
  obtenerRutaInicialPorRol,
  ROLES_USUARIO,
} from "../../utils/autorizacion";
import EstadoCargaRuta from "./EstadoCargaRuta";

function RutaSitioCliente() {
  const { initializing, isAuthenticated, role } = useAutenticacion();

  if (initializing) {
    return <EstadoCargaRuta />;
  }

  if (
    isAuthenticated &&
    !estaAutorizadoPorRol(role, [ROLES_USUARIO.CLIENTE])
  ) {
    return <Navigate to={obtenerRutaInicialPorRol(role)} replace />;
  }

  return <Outlet />;
}

export default RutaSitioCliente;
