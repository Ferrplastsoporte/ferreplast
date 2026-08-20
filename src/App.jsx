import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// Layout cliente
import Navbar from "./components/layout/Navbar";
import FloatingButtons from "./components/layout/FloatingButtons";

// Layout bodeguero
import BodegueroLayout from "./pages/Bodeguero/components/BodegueroLayout";
// Layout Administrador
import AdministradorLayout from "./pages/admin/components/AdminLayout";

// Páginas públicas
import Login from "./pages/Autenticación-Registro/Login";
import Registro from "./pages/Autenticación-Registro/Registro";
import NuevaContrasena from "./pages/Autenticación-Registro/NuevaPassword";
import RecuperarContrasena from "./pages/Autenticación-Registro/RecuperarPassword";

// Páginas cliente
import Home from "./pages/home/Home";
import Catalogo from "./pages/Cliente/Catalogo";
import Carrito from "./pages/Cliente/Carrito";
import DetalleProducto from "./pages/Cliente/DetalleProducto";
import Cotizacion from "./pages/Cliente/Cotizacion";
import PedidosCliente from "./pages/Cliente/Pedidos";
import Cuenta from "./pages/Cliente/Cuenta";
import Ayuda from "./pages/Cliente/Ayuda";

// Páginas administrador
import AdminDashboard from "./pages/admin/AdminDashboard";
import CrearUsuario from "./pages/admin/CrearUsuario";
import Usuarios from "./pages/admin/Usuarios";
import Pedidos from "./pages/admin/Pedidos";
import Configuracion from "./pages/admin/Configuracion";
import Reportes from "./pages/admin/Reportes";
import Aprobaciones from "./pages/admin/Aprobaciones";
import Pagos from "./pages/admin/Pagos";
import Cotizaciones from "./pages/admin/Cotizaciones";
import Auditoria from "./pages/admin/Auditoria";

// Páginas bodeguero
import BodegueroDashboard from "./pages/Bodeguero/Dashboard";
import BodegueroProductos from "./pages/Bodeguero/Productos";
import BodegueroStock from "./pages/Bodeguero/Stock";
import BodegueroSolicitudes from "./pages/Bodeguero/Solicitudes";
import BodegueroFamilias from "./pages/Bodeguero/Familias";
import BodegueroMarcas from "./pages/Bodeguero/Marcas";
import BodegueroUnidades from "./pages/Bodeguero/Unidades";
import BodegueroDocumentos from "./pages/Bodeguero/DocumentosProductos";

// Webpay PLus
import PagoResultado from "./pages/Cliente/PagoResultado";

function ClienteLayout() {
  return (
    <>
      <Navbar />
      <FloatingButtons />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/NuevaContrasena" element={<NuevaContrasena />} />
        <Route path="/RecuperarContrasena" element={<RecuperarContrasena />} />

        {/* Cliente y sitio público */}
        <Route element={<ClienteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/pago/resultado" element={<PagoResultado />} />
          <Route path="/cotizacion" element={<Cotizacion />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
          <Route path="/pedidos" element={<PedidosCliente />} />
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="/ayuda" element={<Ayuda />} />
                    

        </Route>

        {/* Administrador */}
        <Route element={<AdministradorLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/crearUsuario" element={<CrearUsuario />} />
          <Route path="/admin/aprobaciones" element={<Aprobaciones />} />
          <Route path="/admin/cotizaciones" element={<Cotizaciones />} />
          <Route path="/admin/pedidos" element={<Pedidos />} />
          <Route path="/admin/pagos" element={<Pagos />} />
          <Route path="/admin/reportes" element={<Reportes />} />
          <Route path="/admin/auditoria" element={<Auditoria />} />
          <Route path="/admin/configuracion" element={<Configuracion />} />
        </Route>

        {/* Bodeguero */}
        <Route element={<BodegueroLayout />}>
          <Route path="/bodeguero" element={<BodegueroDashboard />} />
          <Route path="/bodeguero/productos" element={<BodegueroProductos />} />
          <Route path="/bodeguero/stock" element={<BodegueroStock />} />
          <Route
            path="/bodeguero/solicitudes"
            element={<BodegueroSolicitudes />}
          />
          <Route path="/bodeguero/familias" element={<BodegueroFamilias />} />
          <Route path="/bodeguero/marcas" element={<BodegueroMarcas />} />
          <Route path="/bodeguero/unidades" element={<BodegueroUnidades />} />
          <Route path="/bodeguero/documentos" element={<BodegueroDocumentos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
