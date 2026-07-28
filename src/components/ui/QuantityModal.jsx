import QuantitySelector from "./QuantitySelector";
import "../css/AddToCotizacionButton.css";

function QuantityModal({
  titulo,
  nombreProducto,
  stockDisponible,
  cantidad,
  onCantidadChange,
  onCancelar,
  onConfirmar,
  textoConfirmar = "Agregar",
  procesando = false,
  maximoCantidad,
}) {
  const stock = Math.max(
    0,
    Number(stockDisponible) || 0,
  );

  const maximo = Math.max(
    1,
    Number(maximoCantidad ?? stock) || 1,
  );

  function detenerPropagacion(evento) {
    evento.stopPropagation();
  }

  function manejarCancelar(evento) {
    evento.stopPropagation();
    onCancelar();
  }

  function manejarConfirmar(evento) {
    evento.stopPropagation();
    onConfirmar();
  }

  return (
    <div
      className="add-cotizacion__selector"
      role="dialog"
      aria-modal="false"
      aria-label={`Seleccionar cantidad de ${nombreProducto}`}
      onClick={detenerPropagacion}
    >
      <p className="add-cotizacion__title">
        {titulo}
      </p>

      <p className="add-cotizacion__stock">
        Stock actual: {stock}
      </p>

      <QuantitySelector
        cantidad={cantidad}
        minimo={1}
        maximo={maximo}
        onChange={onCantidadChange}
        disabled={procesando}
      />

      <div className="add-cotizacion__actions">
        <button
          type="button"
          className="add-cotizacion__cancel"
          onClick={manejarCancelar}
          disabled={procesando}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="add-cotizacion__confirm"
          onClick={manejarConfirmar}
          disabled={procesando}
        >
          {procesando
            ? "Agregando..."
            : textoConfirmar}
        </button>
      </div>
    </div>
  );
}

export default QuantityModal;