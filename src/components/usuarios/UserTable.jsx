const UserTable = ({ usuarios, onEditar, onEliminar }) => {
  return (
    <table className="user-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios?.map(usuario => (
          <tr key={usuario.id_user}>
            <td>{usuario.nom_user}</td>
            <td>{usuario.email}</td>
            <td>{usuario.rol_user}</td>
            <td>
              <span className={`estado-badge ${usuario.est_user ? 'activo' : 'inactivo'}`}>
                {usuario.est_user ? '✅ Activo' : '⛔ Inactivo'}
              </span>
            </td>
            <td>
              <button onClick={() => onEditar(usuario)} className="btn-edit">✏️</button>
              <button onClick={() => onEliminar(usuario.id_user)} className="btn-delete">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default UserTable