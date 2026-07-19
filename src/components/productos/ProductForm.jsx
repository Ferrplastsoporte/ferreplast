import { useState } from 'react'

const ProductForm = ({ onSubmit, productoInicial = null }) => {
  const [nombre, setNombre] = useState(productoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(productoInicial?.descripcion || '')
  const [precio, setPrecio] = useState(productoInicial?.precio || '')
  const [imagen, setImagen] = useState(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    await onSubmit({ nombre, descripcion, precio: parseFloat(precio), imagen })
    setCargando(false)
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del producto"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
        className="product-form-input"
      />

      <textarea
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        required
        className="product-form-textarea"
      />

      <input
        type="number"
        placeholder="Precio"
        value={precio}
        onChange={(e) => setPrecio(e.target.value)}
        required
        className="product-form-input"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImagen(e.target.files[0])}
        className="product-form-input"
      />

      <button type="submit" disabled={cargando} className="product-form-button">
        {cargando ? 'Guardando...' : 'Guardar Producto'}
      </button>
    </form>
  )
}

export default ProductForm