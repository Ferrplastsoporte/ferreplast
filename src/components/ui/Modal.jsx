const Modal = ({ visible, tipo, titulo, mensaje, onClose, className = '' }) => {
  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-registro modal-registro--${tipo} ${className}`} 
        onClick={e => e.stopPropagation()}
      >
        <h2>{titulo}</h2>
        <p>{mensaje}</p>
        <button onClick={onClose}>Entendido</button>
      </div>
    </div>
  )
}

export default Modal