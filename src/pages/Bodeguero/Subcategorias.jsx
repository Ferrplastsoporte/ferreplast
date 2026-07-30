import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import './css/bodeguero.css'
import '../../components/css/productos.css'

function Subcategorias() {
  const [subcategorias, setSubcategorias] = useState([])
  const [familias, setFamilias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')
  const [familiaId, setFamiliaId] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    
    // Cargar familias para el select
    const { data: familiasData, error: famError } = await supabase
      .from('familia')
      .select('*')
      .order('nom_familia', { ascending: true })
    
    if (famError) {
      console.error('Error cargando familias:', famError)
    } else {
      setFamilias(familiasData || [])
    }

    // Cargar subcategorias con nombre de familia
    const { data: subData, error: subError } = await supabase
      .from('subcategoria')
      .select(`
        *,
        familia (
          nom_familia
        )
      `)
      .order('nom_subcategoria', { ascending: true })
    
    if (subError) {
      console.error('Error cargando subcategorías:', subError)
    } else {
      setSubcategorias(subData || [])
    }
    
    setCargando(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert('El nombre de la subcategoría es obligatorio')
      return
    }
    if (!familiaId) {
      alert('Debes seleccionar una familia')
      return
    }

    const payload = {
      nom_subcategoria: nombre.trim(),
      id_familia: parseInt(familiaId)
    }

    if (editando) {
      const { error } = await supabase
        .from('subcategoria')
        .update(payload)
        .eq('id_subcategoria', editando)
      
      if (error) {
        alert('Error al actualizar: ' + error.message)
      } else {
        setEditando(null)
        setNombre('')
        setFamiliaId('')
        setMostrarForm(false)
        cargarDatos()
      }
    } else {
      const { error } = await supabase
        .from('subcategoria')
        .insert([payload])
      
      if (error) {
        alert('Error al crear: ' + error.message)
      } else {
        setNombre('')
        setFamiliaId('')
        setMostrarForm(false)
        cargarDatos()
      }
    }
  }

  const handleEdit = (item) => {
    setEditando(item.id_subcategoria)
    setNombre(item.nom_subcategoria)
    setFamiliaId(String(item.id_familia))
    setMostrarForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta subcategoría?')) {
      const { error } = await supabase
        .from('subcategoria')
        .delete()
        .eq('id_subcategoria', id)
      
      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        cargarDatos()
      }
    }
  }

  if (cargando) {
    return (
      <div className="admin-layout">
        <BodegueroSidebar />
        <div className="admin-content">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <BodegueroSidebar />
      <div className="admin-content">
        <BodegueroHeader titulo="Administrar Subcategorías" />

        <button className="btn-add" onClick={() => { setMostrarForm(true); setEditando(null); setNombre(''); setFamiliaId('') }}>
          + Nueva Subcategoría
        </button>

        {mostrarForm && (
          <form className="product-form" onSubmit={handleSubmit}>
            <select
              className="product-form-input"
              value={familiaId}
              onChange={(e) => setFamiliaId(e.target.value)}
              required
            >
              <option value="">Selecciona una familia</option>
              {familias.map(f => (
                <option key={f.id_familia} value={f.id_familia}>
                  {f.nom_familia}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nombre de la subcategoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="product-form-input"
            />

            <div className="product-form-actions">
              <button type="submit" className="product-form-button">
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                className="product-form-button-cancel"
                onClick={() => { setMostrarForm(false); setEditando(null); setNombre(''); setFamiliaId('') }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="product-table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>Subcategoría</th>
                <th>Familia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {subcategorias.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No hay subcategorías creadas
                  </td>
                </tr>
              ) : (
                subcategorias.map(s => (
                  <tr key={s.id_subcategoria}>
                    <td>{s.nom_subcategoria}</td>
                    <td>{s.familia?.nom_familia || 'Sin familia'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(s)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(s.id_subcategoria)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Subcategorias