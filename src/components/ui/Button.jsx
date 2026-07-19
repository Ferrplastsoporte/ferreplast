const Button = ({ 
  type = 'button', 
  onClick, 
  loading = false, 
  disabled = false, 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading ? 'Cargando...' : children}
    </button>
  )
}

export default Button