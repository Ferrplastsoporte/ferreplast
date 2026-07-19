import EstadoBadge from './EstadoBadge'

const PedidoList = ({ pedidos, onCambiarEstado }) => {
  if (!pedidos || pedidos.length === 0) {
    return <p className="text-center text-gray-500">No hay pedidos pendientes</p>
  }

  return (
    <div className="pedido-list">
      {pedidos.map(pedido => (
        <div key={pedido.id} className="pedido-item">
          <div className="pedido-info">
            <h4>Pedido #{pedido.id}</h4>
            <EstadoBadge estado={pedido.estado} />
            <p>Cliente: {pedido.cliente_nombre}</p>
          </div>
          <div className="pedido-actions">
            {pedido.estado === 'pendiente' && (
              <button onClick={() => onCambiarEstado(pedido.id, 'en_preparacion')}>
                Preparar
              </button>
            )}
            {pedido.estado === 'en_preparacion' && (
              <button onClick={() => onCambiarEstado(pedido.id, 'despachado')}>
                Despachar
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default PedidoList