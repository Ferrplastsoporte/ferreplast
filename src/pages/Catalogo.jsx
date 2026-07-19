import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import ProductList from '../components/productos/ProductList'
import './css/Catalogo.css'

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

  const agregarAlCarrito = async (productoId) => {
    const { error } = await supabase
      .from('carrito')
      .insert([{ id_producto: productoId, cantidad: 1 }])

    if (error) {
      console.error('Error al agregar:', error)
      alert('Error al agregar al carrito')
    } else {
      alert('¡Producto agregado!')
    }
  }

  if (cargando) return <p className="text-center">Cargando productos...</p>

  return (
    <div className="catalogo-container">
      <h1>Catálogo de Productos</h1>
      <ProductList productos={productos} onAgregar={agregarAlCarrito} />
    </div>
  )
}

export default Catalogo