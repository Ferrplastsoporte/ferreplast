import { Link } from 'react-router-dom'
import '../css/admin.css'

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <h2>FERREPLAST</h2>
      <nav>
        <Link to="/admin" className="active">📊 Dashboard</Link>
        <Link to="/admin/bodega">📦 Bodega</Link>
        <Link to="/admin/productos">📦 Productos</Link>
        <Link to="/admin/usuarios">👥 Usuarios</Link>
        <Link to="/admin/ventas">💰 Ventas</Link>
        <Link to="/admin/crear-usuario">➕ Crear Usuario</Link>
        <Link to="/admin/configuracion">⚙️ Configuración</Link>
      </nav>
    </aside>
  )
}

export default AdminSidebar