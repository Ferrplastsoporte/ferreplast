import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import './css/admin.css'  

function Configuracion() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Configuración" />
        <p>Configuración del sistema</p>
      </div>
    </div>
  )
}

export default Configuracion