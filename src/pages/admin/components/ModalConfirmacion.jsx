import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  variante = "peligro",
  procesando = false,
  onConfirmar,
  onCancelar,
}) {
  const botonCancelarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    botonCancelarRef.current?.focus();

    function cerrarConEscape(evento) {
      if (evento.key === "Escape" && !procesando) onCancelar();
    }

    globalThis.addEventListener("keydown", cerrarConEscape);
    return () => globalThis.removeEventListener("keydown", cerrarConEscape);
  }, [abierto, onCancelar, procesando]);

  if (!abierto) return null;

  const Icono = variante === "exito" ? FiCheckCircle : FiAlertTriangle;

  return (
    <div
      className="modal-confirmacion__fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !procesando) onCancelar();
      }}
    >
      <section
        className="modal-confirmacion"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacion-titulo"
        aria-describedby="modal-confirmacion-mensaje"
      >
        <div
          className={`modal-confirmacion__icono modal-confirmacion__icono--${variante}`}
        >
          <Icono aria-hidden="true" />
        </div>

        <div className="modal-confirmacion__contenido">
          <h2 id="modal-confirmacion-titulo">{titulo}</h2>
          <p id="modal-confirmacion-mensaje">{mensaje}</p>
        </div>

        <div className="modal-confirmacion__acciones">
          <button
            ref={botonCancelarRef}
            type="button"
            className="modal-confirmacion__cancelar"
            onClick={onCancelar}
            disabled={procesando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`modal-confirmacion__confirmar modal-confirmacion__confirmar--${variante}`}
            onClick={onConfirmar}
            disabled={procesando}
          >
            {procesando ? "Actualizando…" : textoConfirmar}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ModalConfirmacion;
