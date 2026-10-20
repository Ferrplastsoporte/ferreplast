import {
  Cotizacion,
  PedidosCliente,
  Cuenta,
  DetallePedido,
  PagoResultado,
} from "./secciones/PaginasCliente";
import CargaSeccion from "../components/rutas/CargaSeccion";
import { Route } from "react-router-dom";
import RutaProtegida from "../components/rutas/RutaProtegida";
import RutaSitioCliente from "../components/rutas/RutaSitioCliente";
import Home from "../pages/home/Home";
import Catalogo from "../pages/Cliente/Catalogo";
import Carrito from "./secciones/PaginaCarrito";
import DetalleProducto from "../pages/Cliente/DetalleProducto";

import Ayuda from "../pages/Cliente/Ayuda";

import ClienteLayout from "../components/layout/ClienteLayout";
import { ROLES_USUARIO } from "../utils/auth/autorizacion";

// Los guards se cargan al inicio; las páginas privadas se descargan por sección.
const rutasCliente = (
  <>
    {/* Cliente y sitio público */}
    <Route element={<RutaSitioCliente />}>
      <Route element={<ClienteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route element={<CargaSeccion />}>
          <Route path="/carrito" element={<Carrito />} />
        </Route>
        <Route path="/producto/:id" element={<DetalleProducto />} />
        <Route path="/ayuda" element={<Ayuda />} />

        <Route
          element={
            <RutaProtegida rolesPermitidos={[ROLES_USUARIO.CLIENTE]} />
          }
        >
          <Route element={<CargaSeccion />}>
            <Route path="/pago/resultado" element={<PagoResultado />} />
            <Route path="/cotizacion" element={<Cotizacion />} />
            <Route path="/pedidos" element={<PedidosCliente />} />
            <Route path="/pedidos/:id" element={<DetallePedido />} />
            <Route path="/cuenta" element={<Cuenta />} />
          </Route>

        </Route>
      </Route>
    </Route>
  </>
);

export default rutasCliente;
