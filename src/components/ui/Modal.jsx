const Modal = ({
  visible,
  tipo,
  titulo,
  mensaje,
  onClose,
  className = '',
  children,
  accionSecundaria,
  textoAccionSecundaria,
  accionSecundariaDeshabilitada = false,
}) => {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-registro modal-registro--${tipo} ${className}`} 
        onClick={e => e.stopPropagation()}
      >
        <h2>{titulo}</h2>
        <p>{mensaje}</p>
        {children}

        <div className="modal-registro__acciones">
          {accionSecundaria && textoAccionSecundaria && (
            <button
              type="button"
              className="modal-registro__accion-secundaria"
              onClick={accionSecundaria}
              disabled={accionSecundariaDeshabilitada}
            >
              {textoAccionSecundaria}
            </button>
          )}

          <button type="button" onClick={onClose}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

export default Modal
