import { useState } from 'react'

const UserForm = ({ onSubmit, usuarioInicial = null }) => {
  const [nombre, setNombre] = useState(usuarioInicial?.nom_user || '')
  const [email, setEmail] = useState(usuarioInicial?.email || '')
  const [rol, setRol] = useState(usuarioInicial?.rol_user || 'cliente')
  const [estado, setEstado] = useState(usuarioInicial?.est_user !== undefined ? usuarioInicial.est_user : true)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    await onSubmit({ nombre, email, rol, estado })
    setCargando(false)
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre completo"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="user-form-input"
      />

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="user-form-input"
      />

      <select
        value={rol}
        onChange={(e) => setRol(e.target.value)}
        className="user-form-select"
      >
        <option value="cliente">Cliente</option>
        <option value="bodeguero">Bodeguero</option>
        <option value="vendedor">Vendedor</option>
        <option value="admin">Administrador</option>
      </select>

      <label className="user-form-checkbox">
        <input
          type="checkbox"
          checked={estado}
          onChange={(e) => setEstado(e.target.checked)}
        />
        Usuario activo
      </label>

      <button type="submit" disabled={cargando} className="user-form-button">
        {cargando ? 'Guardando...' : 'Guardar Usuario'}
      </button>
    </form>
  )
}

export default UserForm