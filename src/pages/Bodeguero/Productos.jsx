import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import ProductTable from '../../components/productos/ProductTable'
import ProductForm from '../../components/productos/ProductForm'
import './css/bodeguero.css'
import '../../components/css/productos.css'   

function BodegueroProductos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarProductos()
  }, [])

  const cargarProductos = async () => {
    setCargando(true)
    setError(null)
    
    try {
      console.log('🔍 Intentando cargar productos...')
      console.log('📋 Tabla: productos (PLURAL)')
      
      const { data, error } = await supabase
        .from('producto')  
        .select('*')
        .order('created_prod', { ascending: false })
      
      if (error) {
        console.error('❌ Error de Supabase:', error)
        setError(error.message)
        alert('Error al cargar productos: ' + error.message)
      } else {
        console.log('✅ Productos cargados:', data?.length || 0)
        setProductos(data || [])
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      setError(err.message)
    }
    
    setCargando(false)
  }

  const handleCrear = async (datos) => {
    setError(null)
    
    try {
      console.log('📝 Creando producto en tabla: productos (PLURAL)')
      
      let imagenUrl = ''
      let pdfUrl = ''
      let pdfNombre = ''

      if (datos.imagen) {
        const fileName = `${Date.now()}_${datos.imagen.name}`
        const { error } = await supabase.storage
          .from('imagenes_productos')
          .upload(fileName, datos.imagen)
        if (!error) {
          const { data } = supabase.storage.from('imagenes_productos').getPublicUrl(fileName)
          imagenUrl = data.publicUrl
        }
      }

      if (datos.pdf) {
        const fileName = `${Date.now()}_${datos.pdf.name}`
        const { error } = await supabase.storage
          .from('producto-documentos')
          .upload(fileName, datos.pdf)
        if (!error) {
          const { data } = supabase.storage.from('producto-documentos').getPublicUrl(fileName)
          pdfUrl = data.publicUrl
          pdfNombre = datos.pdf.name
        }
      }

      const { error } = await supabase
        .from('producto')  
        .insert([{ 
          nom_prod: datos.nombre,
          desc_prod: datos.descripcion,
          precio_prod: datos.precio,
          precio_act: datos.precio,
          color_prod: datos.color || null,
          peso_prod: datos.peso || null,
          id_und_medida: datos.id_und_medida || 1,
          id_marca: datos.id_marca || null,
          id_subcategoria: datos.id_subcategoria || 1,
          imagen_url: imagenUrl,
          stock_prod: 0,
          est_prod: 2,
          pdf_url: pdfUrl,
          pdf_nombre: pdfNombre
        }])

      if (error) {
        console.error('❌ Error creando producto:', error)
        setError(error.message)
        alert('Error al crear producto: ' + error.message)
      } else {
        console.log('✅ Producto creado correctamente')
        setMostrarForm(false)
        cargarProductos()
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err)
      setError(err.message)
      alert('Error inesperado: ' + err.message)
    }
  }

  const handleEditar = async (datos) => {
    const { error } = await supabase
      .from('producto')
      .update(datos)
      .eq('id_prod', productoEditando.id_prod)

    if (!error) {
      setProductoEditando(null)
      cargarProductos()
    } else {
      alert('Error al editar: ' + error.message)
    }
  }

  const desactivarProducto = async (id) => {
    if (confirm('¿Desactivar este producto? Los clientes no podrán verlo.')) {
      const { error } = await supabase
        .from('producto') 
        .update({ est_prod: 3 })
        .eq('id_prod', id)
      if (!error) cargarProductos()
    }
  }

  if (cargando) return <p>Cargando...</p>

  return (
    <div className="admin-layout">
      <BodegueroSidebar />
      <div className="admin-content">
        <BodegueroHeader titulo="Gestión de Productos" />

        {error && (
          <div style={{ 
            background: '#f8d7da', 
            color: '#721c24', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <strong>Error:</strong> {error}
            <br />
            <button 
              onClick={cargarProductos}
              style={{ marginTop: '10px', padding: '5px 15px', cursor: 'pointer' }}
            >
              Reintentar
            </button>
          </div>
        )}

        <button className="btn-add" onClick={() => setMostrarForm(true)}>
          + Nuevo Producto
        </button>

        {mostrarForm && (
          <ProductForm 
            onSubmit={handleCrear}
            onCancel={() => setMostrarForm(false)}
          />
        )}

        {productoEditando && (
          <ProductForm 
            productoInicial={productoEditando}
            onSubmit={handleEditar}
            onCancel={() => setProductoEditando(null)}
          />
        )}

        <ProductTable 
          productos={productos}
          onEditar={setProductoEditando}
          onEliminar={() => {}}
          onDesactivar={desactivarProducto}
          modo="bodeguero"
        />
      </div>
    </div>
  )
}

export default BodegueroProductos