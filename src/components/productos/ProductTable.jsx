import { formatPrice } from '../../utils/formatters'

const ProductTable = ({ 
  productos, 
  onEditar, 
  onEliminar, 
  onAprobar,
  onDesactivar,
  modo = 'cliente'
}) => {
  const getEstadoLabel = (estado) => {
    const estados = {
      1: { label: '✅ Activo', className: 'estado-activo' },
      2: { label: '⏳ Pendiente', className: 'estado-pendiente' },
      3: { label: '⛔ Inactivo', className: 'estado-inactivo' }
    }
    return estados[estado] || { label: '❓ Desconocido', className: '' }
  }

  return (
    <div className="product-table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Stock</th>
            <th>Precio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos?.map(producto => {
            const estadoInfo = getEstadoLabel(producto.est_prod)
            
            return (
              <tr key={producto.id_prod}>  {/* ← CAMBIADO */}
                <td>{producto.nom_prod}</td>  {/* ← CAMBIADO */}
                <td>
                  <span className={`stock-badge ${producto.stock_prod < 10 ? 'stock-bajo' : ''}`}>
                    {producto.stock_prod} unidades  {/* ← CAMBIADO */}
                  </span>
                </td>
                <td>{formatPrice(producto.precio_prod)}</td>  {/* ← CAMBIADO */}
                <td>
                  <span className={estadoInfo.className}>
                    {estadoInfo.label}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    {(modo === 'bodeguero' || modo === 'admin') && (
                      <button onClick={() => onEditar(producto)} className="btn-edit">✏️</button>
                    )}
                    
                    {modo === 'bodeguero' && producto.est_prod === 1 && (
                      <button onClick={() => onDesactivar(producto.id_prod)} className="btn-deactivate">⛔</button>
                    )}
                    
                    {modo === 'admin' && producto.est_prod === 2 && (
                      <button onClick={() => onAprobar(producto.id_prod)} className="btn-approve">✅</button>
                    )}
                    
                    {modo === 'admin' && producto.est_prod === 1 && (
                      <button onClick={() => onDesactivar(producto.id_prod)} className="btn-deactivate">⛔</button>
                    )}
                    
                    {modo === 'admin' && (
                      <button onClick={() => onEliminar(producto.id_prod)} className="btn-delete">🗑️</button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProductTable