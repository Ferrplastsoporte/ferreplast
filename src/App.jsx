import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";

// Layout cliente
import Navbar from "./components/layout/Navbar";
import FloatingButtons from "./components/layout/FloatingButtons";

// Layout bodeguero
import BodegueroLayout from "./pages/Bodeguero/components/BodegueroLayout";

// Páginas públicas
import Login from "./pages/Autenticación-Registro/Login";
import Registro from "./pages/Autenticación-Registro/Registro";

// Páginas cliente
import Home from "./pages/home/Home";
import Catalogo from "./pages/Cliente/Catalogo";
import Carrito from "./pages/Cliente/Carrito";
import DetalleProducto from "./pages/Cliente/DetalleProducto";
import Cotizacion from "./pages/Cliente/Cotizacion";

// Páginas administrador
import AdminDashboard from "./pages/admin/AdminDashboard";
import Bodega from "./pages/admin/Bodega";
import Productos from "./pages/admin/Productos";
import CrearUsuario from "./pages/admin/CrearUsuario";
import Usuarios from "./pages/admin/Usuarios";
import Ventas from "./pages/admin/Ventas";
import Configuracion from "./pages/admin/Configuracion";
import Dashboard from "./pages/admin/Dashboard";
import Reportes from "./pages/admin/reportes";

// Páginas bodeguero
import BodegueroDashboard from "./pages/Bodeguero/Dashboard";
import BodegueroProductos from "./pages/Bodeguero/Productos";
import BodegueroStock from "./pages/Bodeguero/Stock";
import BodegueroSolicitudes from "./pages/Bodeguero/Solicitudes";
import BodegueroFamilias from "./pages/Bodeguero/Familias";
import BodegueroMarcas from "./pages/Bodeguero/Marcas";
import BodegueroUnidades from "./pages/Bodeguero/Unidades";


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

        {/* Cliente y sitio público */}
        <Route element={<ClienteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/cotizacion" element={<Cotizacion />} />
          <Route path="/producto/:id" element={<DetalleProducto />} />
        </Route>

        {/* Administrador */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bodega" element={<Bodega />} />
        <Route path="/admin/productos" element={<Productos />} />
        <Route path="/admin/crear-usuario" element={<CrearUsuario />} />
        <Route path="/admin/usuarios" element={<Usuarios />} />
        <Route path="/admin/ventas" element={<Ventas />} />
        <Route path="/admin/configuracion" element={<Configuracion />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/reportes" element={<Reportes />} />

        {/* Bodeguero */}
        <Route element={<BodegueroLayout />}>
          <Route path="/bodeguero" element={<BodegueroDashboard />} />
          <Route path="/bodeguero/productos" element={<BodegueroProductos />} />
          <Route path="/bodeguero/stock" element={<BodegueroStock />} />
          <Route path="/bodeguero/solicitudes" element={<BodegueroSolicitudes />} />
          <Route path="/bodeguero/familias" element={<BodegueroFamilias />} />
          <Route path="/bodeguero/marcas" element={<BodegueroMarcas />} />
          <Route path="/bodeguero/unidades" element={<BodegueroUnidades />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
