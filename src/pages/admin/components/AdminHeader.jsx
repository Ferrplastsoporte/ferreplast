import "../css/Admin.css";

function AdminHeader({ titulo, descripcion = "", acciones = null }) {
  return (
    <header className="admin-header">
      <div className="admin-header__information">
        <h1>{titulo}</h1>

        {descripcion && <p>{descripcion}</p>}
      </div>

      <div className="admin-header__user">
        {acciones}
        <span className="admin-header__role">Administrador</span>
      </div>
    </header>
  );
}

export default AdminHeader;
