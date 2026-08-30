function TarjetaPedido({
  pedido,
  formatearFecha,
  formatearPrecio,
  obtenerEstado,
  onVerDetalle,
}) {
  const estado = obtenerEstado(pedido);

  const cantidadProductos = (
    pedido.detalle_pedido || []
  ).reduce(
    (total, detalle) =>
      total + Number(detalle.cantidad || 0),
    0
  );

  return (
    <article className="pedido-card">

      {/* Cabecera del pedido */}
      <div className="pedido-card__top">

        <div>
          <span className="pedido-card__label">
            PEDIDO
          </span>

          <h2>
            #{pedido.id_pedido}
          </h2>
        </div>

        <div className="pedido-card__estado">
          {estado}
        </div>

      </div>


      {/* Información principal */}
      <div className="pedido-card__meta">

        <div>
          <span>Fecha</span>

          <strong>
            {formatearFecha(
              pedido.fecha_predido
            )}
          </strong>
        </div>


        <div>
          <span>Productos</span>

          <strong>
            {cantidadProductos}
          </strong>
        </div>


        <div>
          <span>Total</span>

          <strong>
            {formatearPrecio(
              pedido.total_pedido
            )}
          </strong>
        </div>

      </div>


      {/* Pie de la tarjeta */}
      <div className="pedido-card__footer">

        <span>
          {pedido.es_factura
            ? "Factura"
            : "Boleta"}
        </span>


        <button
          type="button"
          onClick={onVerDetalle}
        >
          Ver pedido

          <span aria-hidden="true">
            →
          </span>
        </button>

      </div>

    </article>
  );
}

export default TarjetaPedido;
