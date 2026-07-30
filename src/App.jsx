import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Layouts
import Navbar from './components/layout/Navbar'
import FloatingButtons from './components/layout/FloatingButtons'

// Pages
import Home from './pages/home/Home'
import Catalogo from './pages/Catalogo'
import Carrito from './pages/Carrito'
import Login from './pages/Login'
import Registro from './pages/Registro'
import DetalleProducto from "./pages/DetalleProducto"
import Cotizacion from './pages/Cotizacion'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import Bodega from './pages/admin/Bodega'
import Productos from './pages/admin/Productos'
import CrearUsuario from './pages/admin/CrearUsuario'
import Usuarios from './pages/admin/Usuarios'
import Ventas from './pages/admin/Ventas'
import Configuracion from './pages/admin/Configuracion'
import Dashboard from './pages/admin/Dashboard'
import Reportes from './pages/admin/reportes'

// Bodeguero Pages
import BodegueroDashboard from './pages/bodeguero/Dashboard'
import BodegueroProductos from './pages/bodeguero/Productos'
import BodegueroStock from './pages/bodeguero/Stock'
import BodegueroSolicitudes from './pages/bodeguero/Solicitudes'
import BodegueroFamilias from './pages/bodeguero/Familias'
import BodegueroSubcategorias from './pages/bodeguero/Subcategorias'
import BodegueroMarcas from './pages/bodeguero/Marcas'
import BodegueroUnidades from './pages/bodeguero/Unidades'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <FloatingButtons />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/producto/:id" element={<DetalleProducto />}/>

        {/* Clientes */}
        <Route path="/cotizacion" element={<Cotizacion />} />

        {/* Admin */}
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
        <Route path="/bodeguero" element={<BodegueroDashboard />} />
        <Route path="/bodeguero/productos" element={<BodegueroProductos />} />
        <Route path="/bodeguero/stock" element={<BodegueroStock />} />
        <Route path="/bodeguero/solicitudes" element={<BodegueroSolicitudes />} />
        <Route path="/bodeguero/familias" element={<BodegueroFamilias />} />
        <Route path="/bodeguero/subcategorias" element={<BodegueroSubcategorias />} />
        <Route path="/bodeguero/marcas" element={<BodegueroMarcas />} />
        <Route path="/bodeguero/unidades" element={<BodegueroUnidades />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App