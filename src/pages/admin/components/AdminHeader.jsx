import '../css/admin.css'
function AdminHeader({ titulo }) {
  return (
    <header className="admin-header">
      <h1>{titulo}</h1>
      <div className="admin-header-user">
        <span>👤 Admin</span>
      </div>
    </header>
  )
}

export default AdminHeader