import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../utils/formatters'
import './css/Carrito.css'

function Carrito() {
  const [items, setItems] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    obtenerCarrito()
  }, [])

  const obtenerCarrito = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('carrito')
      .select(`
        id_carrito,
        cantidad,
        productos (id, nombre, precio, imagen_url)
      `)

    if (error) {
      console.error('Error al obtener el carrito:', error)
    } else {
      setItems(data || [])
    }
    setCargando(false)
  }

  const eliminarDelCarrito = async (idCarrito) => {
    const { error } = await supabase
      .from('carrito')
      .delete()
      .eq('id_carrito', idCarrito)

    if (error) {
      console.error('Error al eliminar:', error)
    } else {
      setItems(items.filter(item => item.id_carrito !== idCarrito))
    }
  }

  const calcularTotal = () => {
    return items.reduce((acumulado, item) => {
      const precio = item.productos?.precio || 0
      return acumulado + (precio * item.cantidad)
    }, 0)
  }

  if (cargando) return <p className="text-center">Cargando tu carrito...</p>

  if (items.length === 0) {
    return (
      <div className="carrito-container">
        <h1>Tu Carrito de Compras 🛒</h1>
        <p>Tu carrito está vacío.</p>
        <p>Vuelve al catálogo para agregar productos.</p>
      </div>
    )
  }

  return (
    <div className="carrito-container">
      <h1>Tu Carrito de Compras 🛒</h1>
      
      <div className="carrito-content">
        <div className="carrito-lista">
          {items.map((item) => (
            <div key={item.id_carrito} className="carrito-item">
              {item.productos?.imagen_url && (
                <img src={item.productos.imagen_url} alt={item.productos.nombre} />
              )}
              <div className="carrito-item-info">
                <h3>{item.productos?.nombre}</h3>
                <p>Precio: {formatPrice(item.productos?.precio)}</p>
                <p>Cantidad: {item.cantidad}</p>
                <p><strong>Subtotal: {formatPrice(item.productos?.precio * item.cantidad)}</strong></p>
              </div>
              <button onClick={() => eliminarDelCarrito(item.id_carrito)}>
                Eliminar ❌
              </button>
            </div>
          ))}
        </div>

        <div className="carrito-resumen">
          <h2>Resumen</h2>
          <hr />
          <div className="carrito-total">
            <span>Total a pagar:</span>
            <span>{formatPrice(calcularTotal())}</span>
          </div>
          <button onClick={() => alert('Próximamente')}>
            Proceder al Pago
          </button>
        </div>
      </div>
    </div>
  )
}

export default Carrito