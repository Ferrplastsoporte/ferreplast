import {
  BodegueroLayout,
  BodegueroDashboard,
  BodegueroProductos,
  BodegueroStock,
  BodegueroSolicitudes,
  BodegueroFamilias,
  BodegueroMarcas,
  BodegueroUnidades,
  BodegueroDocumentos,
  BodegueroPedidos,
} from "./secciones/PaginasBodega";
import CargaSeccion from "../components/rutas/CargaSeccion";
import { Route } from "react-router-dom";
import RutaProtegida from "../components/rutas/RutaProtegida";

import { ROLES_USUARIO } from "../utils/auth/autorizacion";

// Los guards se cargan al inicio; las páginas privadas se descargan por sección.
const rutasBodega = (
  <>
    {/* Bodeguero */}
    <Route
      element={
        <RutaProtegida rolesPermitidos={[ROLES_USUARIO.BODEGUERO]} />
      }
    >
      <Route element={<CargaSeccion />}>
        <Route element={<BodegueroLayout />}>
          <Route path="/bodeguero" element={<BodegueroDashboard />} />
          <Route
            path="/bodeguero/productos"
            element={<BodegueroProductos />}
          />
          <Route path="/bodeguero/stock" element={<BodegueroStock />} />
          <Route
            path="/bodeguero/solicitudes"
            element={<BodegueroSolicitudes />}
          />
          <Route
            path="/bodeguero/familias"
            element={<BodegueroFamilias />}
          />
          <Route path="/bodeguero/marcas" element={<BodegueroMarcas />} />
          <Route
            path="/bodeguero/unidades"
            element={<BodegueroUnidades />}
          />
          <Route
            path="/bodeguero/documentos"
            element={<BodegueroDocumentos />}
          />
          <Route
            path="/bodeguero/pedidos"
            element={<BodegueroPedidos />}
          />
      </Route>
      </Route>
    </Route>
  </>
);

export default rutasBodega;
