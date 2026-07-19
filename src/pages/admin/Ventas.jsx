import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import './css/admin.css'  

function Ventas() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Ventas" />
        <p>Reportes de ventas</p>
      </div>
    </div>
  )
}

export default Ventas