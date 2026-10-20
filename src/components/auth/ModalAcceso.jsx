import "../css/ModalAcceso.css";

const ModalAcceso = ({
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
    <div className="aviso-acceso-fondo" onClick={onClose}>
      <div 
        className={`aviso-acceso aviso-acceso--${tipo} ${className}`} 
        onClick={e => e.stopPropagation()}
      >
        <h2>{titulo}</h2>
        <p>{mensaje}</p>
        {children}

        <div className="aviso-acceso__acciones">
          {accionSecundaria && textoAccionSecundaria && (
            <button
              type="button"
              className="aviso-acceso__accion-secundaria"
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

export default ModalAcceso
