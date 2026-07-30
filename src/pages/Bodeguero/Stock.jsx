import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import ProductTable from '../../components/productos/ProductTable'
import './css/bodeguero.css'

function BodegueroStock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('stock_prod', { ascending: true })
    setProductos(data || [])
    setCargando(false)
  }

  // 🔹 Ajustar stock
  const handleAjustarStock = async (producto, nuevoStock) => {
    const { error } = await supabase
      .from('productos')
      .update({ stock_prod: nuevoStock })
      .eq('id_prod', producto.id_prod)

    if (!error) cargarProductos()
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div className="admin-layout">
      <BodegueroSidebar />
      <div className="admin-content">
        <BodegueroHeader titulo="Gestión de Stock" />

        <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
          <strong>⚠️ Stock Bajo:</strong> {productos.filter(p => p.stock_prod < 10).length} productos con stock bajo
        </div>

        <ProductTable 
          productos={productos}
          onEditar={(p) => {
            const nuevoStock = prompt(`Nuevo stock para ${p.nom_prod}:`, p.stock_prod)
            if (nuevoStock !== null) handleAjustarStock(p, Number(nuevoStock))
          }}
          onEliminar={() => {}}
        />
      </div>
    </div>
  )
}

export default BodegueroStock