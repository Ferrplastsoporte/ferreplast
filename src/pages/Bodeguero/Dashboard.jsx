import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import StatsCard from '../../components/estadisticas/StatsCard'
import ProductTable from '../../components/productos/ProductTable'
import './css/bodeguero.css'

function BodegueroDashboard() {
  const { profile } = useAuth()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setCargando(true)
    try {
      // 🔹 Bodeguero ve TODOS los productos (activos + pendientes)
      const { data } = await supabase
        .from('productos')
        .select('*')
        .order('created_prod', { ascending: false })
      
      setProductos(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  const productosPendientes = productos.filter(p => p.est_prod === 2)
  const productosActivos = productos.filter(p => p.est_prod === 1)
  const stockBajo = productos.filter(p => p.stock_prod < 10)

  if (cargando) {
    return (
      <div className="admin-layout">
        <BodegueroSidebar />
        <div className="admin-content">
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <BodegueroSidebar />
      <div className="admin-content">
        <BodegueroHeader titulo="Panel de Bodeguero" />

        {/* Stats */}
        <div className="bodega-stats">
          <StatsCard titulo="Total Productos" valor={productos.length} icono="📦" color="blue" />
          <StatsCard titulo="Pendientes" valor={productosPendientes.length} icono="⏳" color="yellow" />
          <StatsCard titulo="Stock Bajo" valor={stockBajo.length} icono="⚠️" color="red" />
        </div>

        {/* Tabla de productos */}
        <div className="bodega-section">
          <h2>📦 Últimos Productos</h2>
          <ProductTable 
            productos={productos.slice(0, 10)}
            onEditar={() => {}}
            onEliminar={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default BodegueroDashboard