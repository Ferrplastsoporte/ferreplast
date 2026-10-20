import {
  AdministradorLayout,
  AdminDashboard,
  CrearUsuario,
  Usuarios,
  Pedidos,
  Configuracion,
  Reportes,
  Aprobaciones,
  Pagos,
  Cotizaciones,
  Auditoria,
} from "./secciones/PaginasAdministrador";
import CargaSeccion from "../components/rutas/CargaSeccion";
import { Route } from "react-router-dom";
import RutaProtegida from "../components/rutas/RutaProtegida";

import { ROLES_USUARIO } from "../utils/auth/autorizacion";

// Los guards se cargan al inicio; las páginas privadas se descargan por sección.
const rutasAdministrador = (
  <>
    {/* Administrador */}
    <Route
      element={
        <RutaProtegida rolesPermitidos={[ROLES_USUARIO.ADMINISTRADOR]} />
      }
    >
      <Route element={<CargaSeccion />}>
        <Route element={<AdministradorLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/crearUsuario" element={<CrearUsuario />} />
          <Route path="/admin/aprobaciones" element={<Aprobaciones />} />
          <Route path="/admin/cotizaciones" element={<Cotizaciones />} />
          <Route path="/admin/pedidos" element={<Pedidos />} />
          <Route path="/admin/pagos" element={<Pagos />} />
          {/* Mantiene el menú del panel visible mientras se descarga Reportes. */}
          <Route element={<CargaSeccion />}>
            <Route path="/admin/Reportes" element={<Reportes />} />
          </Route>
          <Route path="/admin/auditoria" element={<Auditoria />} />
          <Route path="/admin/configuracion" element={<Configuracion />} />
        </Route>
      </Route>
    </Route>
  </>
);

export default rutasAdministrador;
