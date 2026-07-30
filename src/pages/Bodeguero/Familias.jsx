import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import './css/bodeguero.css'
import '../../components/css/productos.css'

function Familias() {
  const [familias, setFamilias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    cargarFamilias()
  }, [])

  const cargarFamilias = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('familia')
      .select('*')
      .order('nom_familia', { ascending: true })
    
    if (error) {
      console.error('Error cargando familias:', error)
      alert('Error al cargar familias')
    } else {
      setFamilias(data || [])
    }
    setCargando(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert('El nombre de la familia es obligatorio')
      return
    }

    if (editando) {
      const { error } = await supabase
        .from('familia')
        .update({ nom_familia: nombre.trim() })
        .eq('id_familia', editando)
      
      if (error) {
        alert('Error al actualizar: ' + error.message)
      } else {
        setEditando(null)
        setNombre('')
        setMostrarForm(false)
        cargarFamilias()
      }
    } else {
      const { error } = await supabase
        .from('familia')
        .insert([{ nom_familia: nombre.trim() }])
      
      if (error) {
        alert('Error al crear: ' + error.message)
      } else {
        setNombre('')
        setMostrarForm(false)
        cargarFamilias()
      }
    }
  }

  const handleEdit = (familia) => {
    setEditando(familia.id_familia)
    setNombre(familia.nom_familia)
    setMostrarForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta familia? Se eliminarán también las subcategorías asociadas.')) {
      const { error } = await supabase
        .from('familia')
        .delete()
        .eq('id_familia', id)
      
      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        cargarFamilias()
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
        <BodegueroHeader titulo="Administrar Familias" />

        <button className="btn-add" onClick={() => { setMostrarForm(true); setEditando(null); setNombre('') }}>
          + Nueva Familia
        </button>

        {mostrarForm && (
          <form className="product-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nombre de la familia"
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
                onClick={() => { setMostrarForm(false); setEditando(null); setNombre('') }}
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
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {familias.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No hay familias creadas
                  </td>
                </tr>
              ) : (
                familias.map(f => (
                  <tr key={f.id_familia}>
                    <td>{f.nom_familia}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(f)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(f.id_familia)}>🗑️</button>
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

export default Familias