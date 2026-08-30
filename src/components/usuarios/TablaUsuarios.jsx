const TablaUsuarios = ({ usuarios, onEditar, onCambiarEstado }) => {
  if (!usuarios || usuarios.length === 0) {
    return (
      <p className="user-table__empty">No hay trabajadores registrados.</p>
    );
  }

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>RUT</th>
            <th>Teléfono</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id_user}>
              <td>{usuario.nom_user}</td>

              <td>{usuario.rut_user || "Sin información"}</td>

              <td>{usuario.phone_user || "Sin información"}</td>

              <td>
                <span className="user-role">
                  {usuario.rol?.nom_rol ??
                    usuario.rol_user?.nom_rol ??
                    "Sin rol"}
                </span>
              </td>

              <td>
                <span
                  className={`estado-badge ${
                    usuario.est_user ? "activo" : "inactivo"
                  }`}
                >
                  {usuario.est_user ? "Activo" : "Inactivo"}
                </span>
              </td>

              <td>
                <div className="user-table__actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => onEditar?.(usuario)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className={usuario.est_user ? "btn-disable" : "btn-enable"}
                    onClick={() => onCambiarEstado?.(usuario)}
                  >
                    {usuario.est_user ? "Deshabilitar" : "Habilitar"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TablaUsuarios;
