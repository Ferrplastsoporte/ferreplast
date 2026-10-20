import SelectorCantidad from "./SelectorCantidad";
import "../css/ModalCantidad.css";

function ModalCantidad({
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
      className="modal-cantidad"
      role="dialog"
      aria-modal="false"
      aria-label={`Seleccionar cantidad de ${nombreProducto}`}
      onClick={detenerPropagacion}
    >
      <p className="modal-cantidad__titulo">
        {titulo}
      </p>

      <p className="modal-cantidad__existencias">
        Stock actual: {stock}
      </p>

      <SelectorCantidad
        cantidad={cantidad}
        minimo={1}
        maximo={maximo}
        onChange={onCantidadChange}
        disabled={procesando}
      />

      <div className="modal-cantidad__acciones">
        <button
          type="button"
          className="modal-cantidad__cancelar"
          onClick={manejarCancelar}
          disabled={procesando}
        >
          Cancelar
        </button>

        <button
          type="button"
          className="modal-cantidad__confirmar"
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

export default ModalCantidad;
