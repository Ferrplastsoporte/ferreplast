import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import StatsGrid from '../../components/estadisticas/StatsGrid'
import './css/admin.css'  

const stats = [
  { titulo: 'Total Usuarios', valor: '156', icono: '👥', color: 'blue' },
  { titulo: 'Productos Activos', valor: '234', icono: '📦', color: 'green' },
  { titulo: 'Ventas Hoy', valor: '$1.234.500', icono: '💰', color: 'purple' },
  { titulo: 'Pedidos Pendientes', valor: '8', icono: '📋', color: 'yellow' }
]

function AdminDashboard() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Dashboard Administrativo" />
        <StatsGrid stats={stats} />
        <div className="admin-welcome">
          <p>Bienvenido al panel de administración de Ferreplast.</p>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard