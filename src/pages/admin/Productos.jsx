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
      .from('producto')
      .select('*')
      .order('created_prod', { ascending: false })  // ← CAMBIADO
    setProductos(data || [])
    setCargando(false)
  }

  // ============================================================
  // ✅ CORREGIDO: Admin crea producto con est_prod = 2
  // ✅ CORREGIDO: Bucket correcto 'imagenes_productos'
  // ============================================================
  const handleSubmit = async (productoData) => {
    let imagenUrl = ''
    
    if (productoData.imagen) {
      const fileName = `${Date.now()}_${productoData.imagen.name}`
      const { error } = await supabase.storage
        .from('imagenes_productos')  // ← CAMBIADO: bucket correcto
        .upload(fileName, productoData.imagen)

      if (error) {
        alert('Error al subir imagen: ' + error.message)
        return
      }

      const { data } = supabase.storage
        .from('imagenes_productos')  // ← CAMBIADO: bucket correcto
        .getPublicUrl(fileName)
      imagenUrl = data.publicUrl
    }

    // 🔹 Insertar con est_prod = 2 (pendiente)
    const { error } = await supabase
      .from('producto')
      .insert([{ 
        nom_prod: productoData.nombre,
        desc_prod: productoData.descripcion,
        precio_prod: productoData.precio,
        precio_act: productoData.precio,
        imagen_url: imagenUrl,
        stock_prod: 0,
        est_prod: 2,  // ← NUEVO: Pendiente de aprobación
        // Valores por defecto para campos requeridos
        id_und_medida: 1,
        id_subcategoria: 1
      }])

    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      alert('✅ Producto creado correctamente (pendiente de aprobación)')
      setMostrarForm(false)
      cargarProductos()
    }
  }

  // ============================================================
  // ✅ NUEVAS FUNCIONES PARA ADMIN
  // ============================================================

  // 🔹 Admin aprueba producto (est_prod 2 → 1)
  const aprobarProducto = async (id) => {
    const { error } = await supabase
      .from('producto')
      .update({ est_prod: 1 })
      .eq('id_prod', id)

    if (!error) cargarProductos()
  }

  // 🔹 Admin desactiva producto (est_prod 1 → 3)
  const desactivarProducto = async (id) => {
    const { error } = await supabase
      .from('producto')
      .update({ est_prod: 3 })
      .eq('id_prod', id)

    if (!error) cargarProductos()
  }

  // 🔹 Admin elimina producto (solo casos excepcionales)
  const eliminarProducto = async (id) => {
    if (confirm('¿Eliminar este producto definitivamente? Esta acción no se puede deshacer.')) {
      const { error } = await supabase
        .from('producto')
        .delete()
        .eq('id_prod', id)

      if (!error) cargarProductos()
    }
  }
  // ============================================================

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
          {/* ✅ ACTUALIZADO: ProductTable con modo admin */}
          <ProductTable 
            productos={productos}
            onEditar={() => {}}  // Admin no edita directamente
            onEliminar={eliminarProducto}
            onAprobar={aprobarProducto}
            onDesactivar={desactivarProducto}
            modo="admin"
          />
        </div>
      </div>
    </div>
  )
}

export default Productos