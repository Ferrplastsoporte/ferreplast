import "../css/admin.css";

function AdminHeader({ titulo, descripcion = "" }) {
  return (
    <header className="admin-header">
      <div className="admin-header__information">
        <h1>{titulo}</h1>

        {descripcion && <p>{descripcion}</p>}
      </div>

      <div className="admin-header__user">
        <span className="admin-header__role">Administrador</span>
      </div>
    </header>
  );
}

export default AdminHeader;
