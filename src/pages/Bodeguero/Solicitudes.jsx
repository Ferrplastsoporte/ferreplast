import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import ProductTable from '../../components/productos/ProductTable'
import './css/bodeguero.css'

function BodegueroSolicitudes() {
  const [pendientes, setPendientes] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarPendientes()
  }, [])

  const cargarPendientes = async () => {
    setCargando(true)
    const { data } = await supabase
      .from('productos')
      .select('*')
      .eq('est_prod', 2)  // Solo pendientes
      .order('created_prod', { ascending: false })
    setPendientes(data || [])
    setCargando(false)
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div className="admin-layout">
      <BodegueroSidebar />
      <div className="admin-content">
        <BodegueroHeader titulo="Solicitudes Pendientes" />

        {pendientes.length === 0 ? (
          <p style={{ padding: '20px', background: '#d4edda', borderRadius: '8px' }}>
            ✅ No hay productos pendientes de aprobación.
          </p>
        ) : (
          <>
            <p style={{ marginBottom: '20px' }}>
              ⏳ {pendientes.length} producto(s) esperando aprobación del administrador.
            </p>
            <ProductTable 
              productos={pendientes}
              onEditar={() => {}}
              onEliminar={() => {}}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default BodegueroSolicitudes