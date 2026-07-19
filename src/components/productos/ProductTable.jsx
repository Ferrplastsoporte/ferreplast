import { formatPrice } from '../../utils/formatters'

const ProductTable = ({ productos, onEditar, onEliminar }) => {
  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {productos?.map(producto => (
          <tr key={producto.id}>
            <td>{producto.nombre}</td>
            <td>
              <span className={`stock-badge ${producto.stock < 10 ? 'stock-bajo' : ''}`}>
                {producto.stock} unidades
              </span>
            </td>
            <td>{formatPrice(producto.precio)}</td>
            <td>
              <button onClick={() => onEditar(producto)} className="btn-edit">✏️</button>
              <button onClick={() => onEliminar(producto.id)} className="btn-delete">🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ProductTable