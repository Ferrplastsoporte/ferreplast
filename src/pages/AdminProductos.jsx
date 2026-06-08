import { useState } from 'react'
import { supabase } from '../lib/supabase'

function AdminProductos() {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [imagen, setImagen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setMensaje('')

    let imagenUrl = ''

    // Subir imagen si existe
    if (imagen) {
      const fileName = `${Date.now()}_${imagen.name}`
      const { data, error } = await supabase.storage
        .from('productos')
        .upload(fileName, imagen)

      if (error) {
        setMensaje('❌ Error al subir imagen: ' + error.message)
        setCargando(false)
        return
      }

      const { data: publicUrl } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName)

      imagenUrl = publicUrl.publicUrl
    }

    // Guardar producto en la base de datos
    const { error } = await supabase
      .from('productos')
      .insert([
        {
          nombre,
          descripcion,
          precio: parseFloat(precio),
          imagen_url: imagenUrl
        }
      ])

    if (error) {
      setMensaje('❌ Error al guardar: ' + error.message)
    } else {
      setMensaje('✅ Producto guardado correctamente')
      setNombre('')
      setDescripcion('')
      setPrecio('')
      setImagen(null)
    }

    setCargando(false)
  }

  return (
    <div style={styles.container}>
      <h1>Subir Producto</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          style={styles.input}
        />

        <textarea
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          style={styles.textarea}
        />

        <input
          type="number"
          placeholder="Precio"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImagen(e.target.files[0])}
          style={styles.input}
        />

        <button type="submit" disabled={cargando} style={styles.button}>
          {cargando ? 'Guardando...' : 'Guardar Producto'}
        </button>

        {mensaje && <p style={mensaje.includes('✅') ? styles.success : styles.error}>{mensaje}</p>}
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '2rem auto',
    padding: '1rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  input: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  textarea: {
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    minHeight: '100px'
  },
  button: {
    padding: '0.75rem',
    backgroundColor: '#2c3e50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  success: {
    color: 'green',
    marginTop: '1rem'
  },
  error: {
    color: 'red',
    marginTop: '1rem'
  }
}

export default AdminProductos