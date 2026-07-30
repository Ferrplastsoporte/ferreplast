import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BodegueroSidebar from './components/BodegueroSidebar'
import BodegueroHeader from './components/BodegueroHeader'
import './css/bodeguero.css'
import '../../components/css/productos.css'

function Marcas() {
  const [marcas, setMarcas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    cargarMarcas()
  }, [])

  const cargarMarcas = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from('marca_producto')
      .select('*')
      .order('nom_marca', { ascending: true })
    
    if (error) {
      console.error('Error cargando marcas:', error)
      alert('Error al cargar marcas')
    } else {
      setMarcas(data || [])
    }
    setCargando(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) {
      alert('El nombre de la marca es obligatorio')
      return
    }

    if (editando) {
      const { error } = await supabase
        .from('marca_producto')
        .update({ nom_marca: nombre.trim() })
        .eq('id_marca', editando)
      
      if (error) {
        alert('Error al actualizar: ' + error.message)
      } else {
        setEditando(null)
        setNombre('')
        setMostrarForm(false)
        cargarMarcas()
      }
    } else {
      const { error } = await supabase
        .from('marca_producto')
        .insert([{ nom_marca: nombre.trim() }])
      
      if (error) {
        alert('Error al crear: ' + error.message)
      } else {
        setNombre('')
        setMostrarForm(false)
        cargarMarcas()
      }
    }
  }

  const handleEdit = (marca) => {
    setEditando(marca.id_marca)
    setNombre(marca.nom_marca)
    setMostrarForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta marca?')) {
      const { error } = await supabase
        .from('marca_producto')
        .delete()
        .eq('id_marca', id)
      
      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        cargarMarcas()
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
        <BodegueroHeader titulo="Administrar Marcas" />

        <button className="btn-add" onClick={() => { setMostrarForm(true); setEditando(null); setNombre('') }}>
          + Nueva Marca
        </button>

        {mostrarForm && (
          <form className="product-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Nombre de la marca"
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
              {marcas.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                    No hay marcas creadas
                  </td>
                </tr>
              ) : (
                marcas.map(m => (
                  <tr key={m.id_marca}>
                    <td>{m.nom_marca}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(m)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(m.id_marca)}>🗑️</button>
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

export default Marcas