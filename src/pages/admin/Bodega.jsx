import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import StatsCard from '../../components/estadisticas/StatsCard'
import ProductTable from '../../components/productos/ProductTable'
import PedidoList from '../../components/pedidos/PedidoList'
import './css/admin.css'  

function Bodega() {
  const [productos, setProductos] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
      
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['pendiente', 'en_preparacion'])
      
      setProductos(productosData || [])
      setPedidos(pedidosData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado })
      .eq('id', pedidoId)

    if (error) {
      console.error('Error al actualizar:', error)
      alert('Error al actualizar el pedido')
    } else {
      setPedidos(pedidos.map(p => 
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      ))
    }
  }

  if (cargando) {
    return (
      <div className="admin-layout">
        <AdminSidebar />
        <div className="admin-content">
          <p>Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Panel de Bodeguero" />
        
        <div className="bodega-stats">
          <StatsCard titulo="Stock Total" valor={productos.length} icono="📦" color="blue" />
          <StatsCard titulo="Pedidos Pendientes" valor={pedidos.filter(p => p.estado === 'pendiente').length} icono="📋" color="yellow" />
          <StatsCard titulo="Stock Bajo" valor={productos.filter(p => p.stock < 10).length} icono="⚠️" color="red" />
        </div>

        <div className="bodega-section">
          <h2>📦 Productos</h2>
          <ProductTable 
            productos={productos}
            onEditar={() => {}}
            onEliminar={() => {}}
          />
        </div>

        <div className="bodega-section">
          <h2>📋 Pedidos Pendientes</h2>
          <PedidoList 
            pedidos={pedidos}
            onCambiarEstado={cambiarEstadoPedido}
          />
        </div>
      </div>
    </div>
  )
}

export default Bodega