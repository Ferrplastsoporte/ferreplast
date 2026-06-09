import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Carrito() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerCarrito()
  }, [])

  const obtenerCarrito = async () => {
    setCargando(true)
    // Hacemos un SELECT relacional: trae los datos de 'carrito' 
    // y junta la información de la tabla 'productos' usando su FK
    const { data, error } = await supabase
      .from('carrito')
      .select(`
        id_carrito,
        cantidad,
        productos (
          id,
          nombre,
          precio,
          imagen_url
        )
      `)

    if (error) {
      console.error('Error al obtener el carrito:', error)
    } else {
      setItems(data || [])
    }
    setCargando(false)
  }

  // Función opcional para eliminar un producto del carrito
  const eliminarDelCarrito = async (idCarrito) => {
    const { error } = await supabase
      .from('carrito')
      .delete()
      .eq('id_carrito', idCarrito)

    if (error) {
      console.error('Error al eliminar:', error)
    } else {
      // Filtramos el estado para quitarlo de la pantalla de inmediato
      setItems(items.filter(item => item.id_carrito !== idCarrito))
    }
  }

  // Calcular el total acumulado del carrito
  const calcularTotal = () => {
    return items.reduce((acumulado, item) => {
      const precio = item.productos?.precio || 0
      return acumulado + (precio * item.cantidad)
    }, 0)
  }

  if (cargando) return <p style={styles.center}>Cargando tu carrito...</p>

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tu Carrito de Compras 🛒</h1>

      {items.length === 0 ? (
        <div style={styles.center}>
          <p>Tu carrito está vacío.</p>
          <p style={{ color: '#666' }}>Vuelve al catálogo para agregar productos.</p>
        </div>
      ) : (
        <div style={styles.contenido}>
          {/* Lista de productos */}
          <div style={styles.lista}>
            {items.map((item) => (
              <div key={item.id_carrito} style={styles.itemCard}>
                {item.productos?.imagen_url && (
                  <img src={item.productos.imagen_url} alt={item.productos.nombre} style={styles.imagen} />
                )}
                <div style={styles.infoDetalle}>
                  <h3 style={styles.productoNombre}>{item.productos?.nombre}</h3>
                  <p style={styles.productoPrecio}>Precio: ${item.productos?.precio.toLocaleString()}</p>
                  <p style={styles.productoCantidad}>Cantidad: {item.cantidad}</p>
                  <p style={styles.subtotal}>
                    Subtotal: ${(item.productos?.precio * item.cantidad).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => eliminarDelCarrito(item.id_carrito)} 
                  style={styles.botonEliminar}
                >
                  Eliminar ❌
                </button>
              </div>
            ))}
          </div>

          {/* Resumen de la compra */}
          <div style={styles.resumen}>
            <h2>Resumen</h2>
            <hr style={styles.linea} />
            <div style={styles.filaTotal}>
              <span>Total a pagar:</span>
              <span style={styles.totalMonto}>${calcularTotal().toLocaleString()}</span>
            </div>
            <button style={styles.botonPagar} onClick={() => alert('¡Próximamente conectar con la tabla Ventas!')}>
              Proceder al Pago
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  title: {
    marginBottom: '2rem'
  },
  contenido: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '2rem',
  },
  lista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  itemCard: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    gap: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  imagen: {
    width: '90px',
    height: '90px',
    objectFit: 'cover',
    borderRadius: '6px'
  },
  infoDetalle: {
    flex: 1
  },
  productoNombre: {
    margin: '0 0 0.3rem 0'
  },
  productoPrecio: {
    margin: '0',
    color: '#555',
    fontSize: '0.95rem'
  },
  productoCantidad: {
    margin: '0',
    color: '#555',
    fontSize: '0.95rem'
  },
  subtotal: {
    margin: '0.3rem 0 0 0',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  botonEliminar: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '0.5rem 0.8rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  resumen: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    height: 'fit-content'
  },
  linea: {
    border: '0',
    borderTop: '1px solid #ddd',
    margin: '1rem 0'
  },
  filaTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem'
  },
  totalMonto: {
    color: '#27ae60'
  },
  botonPagar: {
    width: '100%',
    backgroundColor: '#2980b9',
    color: 'white',
    border: 'none',
    padding: '0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  center: {
    textAlign: 'center',
    marginTop: '3rem',
    fontSize: '1.2rem'
  }
}

export default Carrito

