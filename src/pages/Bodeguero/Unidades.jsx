import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import './css/bodeguero.css'
import '../../components/css/productos.css'

function Unidades() {
  const [unidades, setUnidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    cargarUnidades()
  }, [])

  const cargarUnidades = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('unidad_medida')
      .select('*')
      .order('nom_und_medida', { ascending: true })
    
    if (error) {
      console.error('Error cargando unidades:', error)
      alert('Error al cargar unidades de medida')
    } else {
      setUnidades(data || [])
    }
    setCargando(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert('El nombre de la unidad es obligatorio')
      return
    }

    if (editando) {
      const { error } = await supabase
        .from('unidad_medida')
        .update({ nom_und_medida: nombre.trim() })
        .eq('id_und_medida', editando)
      
      if (error) {
        alert('Error al actualizar: ' + error.message)
      } else {
        setEditando(null)
        setNombre('')
        setMostrarForm(false)
        cargarUnidades()
      }
    } else {
      const { error } = await supabase
        .from('unidad_medida')
        .insert([{ nom_und_medida: nombre.trim() }])
      
      if (error) {
        alert('Error al crear: ' + error.message)
      } else {
        setNombre('')
        setMostrarForm(false)
        cargarUnidades()
      }
    }
  }

  const handleEdit = (unidad) => {
    setEditando(unidad.id_und_medida)
    setNombre(unidad.nom_und_medida)
    setMostrarForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta unidad de medida?')) {
      const { error } = await supabase
        .from('unidad_medida')
        .delete()
        .eq('id_und_medida', id)
      
      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        cargarUnidades()
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
        <BodegueroHeader titulo="Administrar Unidades de Medida" />

        <button className="btn-add" onClick={() => { setMostrarForm(true); setEditando(null); setNombre('') }}>
          + Nueva Unidad
        </button>

        {mostrarForm && (
          <form className="product-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nombre de la unidad (ej: Kg, L, m, Unidad)"
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
              {unidades.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No hay unidades de medida creadas
                  </td>
                </tr>
              ) : (
                unidades.map(u => (
                  <tr key={u.id_und_medida}>
                    <td>{u.nom_und_medida}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(u)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(u.id_und_medida)}>🗑️</button>
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

export default Unidades