import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import StatsCard from '../../components/estadisticas/StatsCard'
import ProductTable from '../../components/productos/ProductTable'
// ============================================================
// ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
// ============================================================
import PedidoList from '../../components/pedidos/PedidoList'
// ============================================================
import './css/admin.css'  

function Bodega() {
  const [productos, setProductos] = useState([])
  // ============================================================
  // ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
  // ============================================================
  const [pedidos, setPedidos] = useState([])
  // ============================================================
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    try {
      // ✅ SE MANTIENE - Cargar productos (sirve)
      const { data: productosData } = await supabase
        .from('productos')
        .select('*')
      
      // ============================================================
      // ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
      // ============================================================
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['pendiente', 'en_preparacion'])
      // ============================================================
      
      setProductos(productosData || [])
      // ============================================================
      // ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
      // ============================================================
      setPedidos(pedidosData || [])
      // ============================================================
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  // ============================================================
  // ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
  // ============================================================
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
  // ============================================================

  // ✅ SE MANTIENE - Estado de carga (sirve)
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

  // ============================================================
  // ✅ NUEVAS FUNCIONES PARA ADMIN (supervisión)
  // ============================================================
  
  // 🔹 Admin aprueba producto (est_prod 2 → 1)
  const aprobarProducto = async (id) => {
    const { error } = await supabase
      .from('productos')
      .update({ est_prod: 1 })
      .eq('id_prod', id)

    if (!error) cargarDatos()
  }

  // 🔹 Admin desactiva producto (est_prod 1 → 3)
  const desactivarProducto = async (id) => {
    const { error } = await supabase
      .from('productos')
      .update({ est_prod: 3 })
      .eq('id_prod', id)

    if (!error) cargarDatos()
  }

  // 🔹 Admin elimina producto (solo casos excepcionales)
  const eliminarProducto = async (id) => {
    if (confirm('¿Eliminar este producto definitivamente? Esta acción no se puede deshacer.')) {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id_prod', id)

      if (!error) cargarDatos()
    }
  }
  // ============================================================

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Supervisión de Bodega" />  {/* ← CAMBIADO */}

        {/* ============================================================
        🚨 AVISO DE CÓDIGO OBSOLETO - VISIBLE EN FRONTEND
        ============================================================ */}
        <div style={{
          backgroundColor: '#ff0000',
          color: 'white',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '24px',
          fontWeight: 'bold',
          border: '5px solid #cc0000'
        }}>
          🚨 ESTA VISTA ES PROVISIONAL - HAY CÓDIGO QUE SE DEBE DESCARTAR
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '15px',
          margin: '10px 0 20px 0',
          borderRadius: '8px',
          border: '2px solid #ffeeba',
          fontSize: '18px'
        }}>
          <strong>📌 LO QUE SE MANTIENE:</strong> Gestión de productos, stock y estadísticas básicas.
          <br />
          <strong style={{ color: '#dc3545' }}>⛔️ LO QUE SE DESCARTA:</strong> Gestión de pedidos (lo maneja empresa externa).
        </div>
        {/* ============================================================ */}
        
        <div className="bodega-stats">
          {/* ✅ SE MANTIENE - Stock total (sirve) */}
          <StatsCard titulo="Stock Total" valor={productos.length} icono="📦" color="blue" />
          
          {/* ✅ NUEVO - Productos pendientes de aprobación */}
          <StatsCard 
            titulo="Pendientes de Aprobar" 
            valor={productos.filter(p => p.est_prod === 2).length} 
            icono="⏳" 
            color="yellow" 
          />
          
          {/* ✅ SE MANTIENE - Stock bajo (sirve) */}
          <StatsCard titulo="Stock Bajo" valor={productos.filter(p => p.stock_prod < 10).length} icono="⚠️" color="red" />
        </div>

        <div className="bodega-section">
          <h2>📦 Productos</h2>
          {/* ✅ ACTUALIZADO - Tabla de productos con modo admin */}
          <ProductTable 
            productos={productos}
            onEditar={() => {}}  // Admin no edita directamente
            onEliminar={eliminarProducto}
            onAprobar={aprobarProducto}
            onDesactivar={desactivarProducto}
            modo="admin"
          />
        </div>

        {/* ============================================================
        ⛔️ SE DEBE DESCARTAR - Ya no gestionamos pedidos
        ============================================================ */}
        <div style={{
          border: '3px solid #dc3545',
          borderRadius: '10px',
          padding: '15px',
          marginTop: '20px',
          position: 'relative',
          backgroundColor: '#fff5f5'
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '20px',
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '4px 15px',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            ⛔️ SECCIÓN DESCARTADA - Gestión de Pedidos (Empresa Externa)
          </div>
          
          <div className="bodega-section" style={{ marginTop: '20px' }}>
            <h2 style={{ color: '#dc3545', textDecoration: 'line-through' }}>📋 Pedidos Pendientes (OBSOLETO)</h2>
            <PedidoList 
              pedidos={pedidos}
              onCambiarEstado={cambiarEstadoPedido}
            />
          </div>
        </div>
        {/* ============================================================ */}
        
      </div>
    </div>
  )
}

export default Bodega