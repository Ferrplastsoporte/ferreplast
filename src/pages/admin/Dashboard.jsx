import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import './css/admin.css'  

function Dashboard() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Dashboard" />
        <p>Dashboard</p>
      </div>
    </div>
  )
}

export default Dashboard