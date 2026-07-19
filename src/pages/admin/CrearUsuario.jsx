import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import RegistroForm from '../../components/auth/RegistroForm'
import './css/admin.css'  

function CrearUsuario() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Crear Nuevo Usuario" />
        <div className="crear-usuario-container">
          <p>Registra bodegueros, vendedores o administradores</p>
          <RegistroForm mode="admin" />
        </div>
      </div>
    </div>
  )
}

export default CrearUsuario