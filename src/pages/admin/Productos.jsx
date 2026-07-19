import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'
import ProductForm from '../../components/productos/ProductForm'
import ProductTable from '../../components/productos/ProductTable'
import './css/admin.css'  

function Productos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })
    setProductos(data || [])
    setCargando(false)
  }

  const handleSubmit = async (productoData) => {
    let imagenUrl = ''
    
    if (productoData.imagen) {
      const fileName = `${Date.now()}_${productoData.imagen.name}`
      await supabase.storage
        .from('productos')
        .upload(fileName, productoData.imagen)
      const { data } = supabase.storage
        .from('productos')
        .getPublicUrl(fileName)
      imagenUrl = data.publicUrl
    }

    const { error } = await supabase
      .from('productos')
      .insert([{ 
        nombre: productoData.nombre,
        descripcion: productoData.descripcion,
        precio: productoData.precio,
        imagen_url: imagenUrl,
        stock: 0
      }])

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      alert('✅ Producto guardado correctamente')
      setMostrarForm(false)
      cargarProductos()
    }
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader titulo="Gestión de Productos" />
        
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-add">
          {mostrarForm ? 'Cancelar' : '+ Agregar Producto'}
        </button>

        {mostrarForm && (
          <div className="productos-form-container">
            <ProductForm onSubmit={handleSubmit} />
          </div>
        )}

        <div className="productos-table-container">
          <ProductTable 
            productos={productos}
            onEditar={() => {}}
            onEliminar={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default Productos