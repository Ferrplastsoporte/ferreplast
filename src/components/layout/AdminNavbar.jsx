import "../css/adminNavbar.css"

function AdminNavbar() {
  return (
    <nav className="admin-navbar">
      <div className="admin-navbar__brand">
        <h2>FERREPLAST</h2>
        <span>Panel Administrativo</span>
      </div>
      
      <div className="admin-navbar__user">
        <span>👤 Administrador</span>
        <button className="admin-navbar__logout">Cerrar sesión</button>
      </div>
    </nav>
  )
}

export default AdminNavbar