function obtenerNombreRol(usuario) {
  if (usuario.rol?.nom_rol) {
    return usuario.rol.nom_rol;
  }

  if (usuario.rol_user?.nom_rol) {
    return usuario.rol_user.nom_rol;
  }

  return Number(usuario.rol_user) === 1 ? "Administrador" : "Bodeguero";
}

function TablaUsuarios({
  usuarios,
  onEditar,
  onCambiarEstado,
  deshabilitado = false,
}) {
  if (!usuarios || usuarios.length === 0) {
    return (
      <div className="usuarios-tabla__vacia">
        <strong>No encontramos trabajadores</strong>
        <p>Prueba cambiando la búsqueda o los filtros seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="usuarios-tabla-contenedor">
      <table className="usuarios-tabla">
        <thead>
          <tr>
            <th>Trabajador</th>
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
              <td>
                <div className="usuarios-tabla__persona">
                  <span aria-hidden="true">
                    {usuario.nom_user?.trim().charAt(0).toUpperCase() || "U"}
                  </span>
                  <strong>{usuario.nom_user}</strong>
                </div>
              </td>
              <td>{usuario.rut_user || "Sin información"}</td>
              <td>{usuario.phone_user || "Sin información"}</td>
              <td>
                <span className="usuarios-tabla__rol">
                  {obtenerNombreRol(usuario)}
                </span>
              </td>
              <td>
                <span
                  className={`usuarios-tabla__estado usuarios-tabla__estado--${
                    usuario.est_user ? "activo" : "inactivo"
                  }`}
                >
                  {usuario.est_user ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div className="usuarios-tabla__acciones">
                  <button
                    type="button"
                    className="usuarios-tabla__editar"
                    onClick={() => onEditar?.(usuario)}
                    disabled={deshabilitado}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={
                      usuario.est_user
                        ? "usuarios-tabla__deshabilitar"
                        : "usuarios-tabla__habilitar"
                    }
                    onClick={() => onCambiarEstado?.(usuario)}
                    disabled={deshabilitado}
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
}

export default TablaUsuarios;
