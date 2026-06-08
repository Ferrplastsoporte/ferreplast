import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Catalogo() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error al cargar:', error)
    } else {
      setProductos(data || [])
    }
    setCargando(false)
  }

  if (cargando) return <p style={styles.center}>Cargando productos...</p>

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Catálogo de Productos</h1>
      <div style={styles.grid}>
        {productos.length === 0 ? (
          <p>No hay productos aún. Ve al panel de administrador para subir uno.</p>
        ) : (
          productos.map((producto) => (
            <div key={producto.id} style={styles.card}>
              {producto.imagen_url && (
                <img src={producto.imagen_url} alt={producto.nombre} style={styles.imagen} />
              )}
              <h3 style={styles.nombre}>{producto.nombre}</h3>
              <p style={styles.descripcion}>{producto.descripcion}</p>
              <p style={styles.precio}>${producto.precio.toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  imagen: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '4px'
  },
  nombre: {
    margin: '0.5rem 0',
    fontSize: '1.2rem'
  },
  descripcion: {
    color: '#666',
    fontSize: '0.9rem'
  },
  precio: {
    fontWeight: 'bold',
    color: '#2c3e50',
    fontSize: '1.2rem'
  },
  center: {
    textAlign: 'center',
    marginTop: '2rem'
  }
}

export default Catalogo