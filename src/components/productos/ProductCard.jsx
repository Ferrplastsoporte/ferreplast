import { formatPrice } from '../../utils/formatters'

const ProductCard = ({ producto, onAgregar, onEditar, modo = 'cliente' }) => {
  return (
    <div className="product-card">
      {producto.imagen_url && (
        <img src={producto.imagen_url} alt={producto.nombre} />
      )}
      <div className="product-info">
        <h3>{producto.nombre}</h3>
        <p className="product-precio">{formatPrice(producto.precio)}</p>
        {modo === 'admin' && (
          <div className="product-actions">
            <button className="btn-edit" onClick={() => onEditar(producto)}>
              ✏️ Editar
            </button>
          </div>
        )}
        {modo === 'cliente' && (
          <button className="btn-add" onClick={() => onAgregar(producto)}>
            Agregar al carrito
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard