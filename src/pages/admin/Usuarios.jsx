import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import UserTable from '../../components/usuarios/UserTable'
import './css/admin.css'  

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    const { data } = await supabase
      .from('usuario')
      .select('*')
    setUsuarios(data || [])
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Gestión de Usuarios" />
        <UserTable usuarios={usuarios} />
      </div>
    </div>
  )
}

export default Usuarios