const Input = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  onBlur, 
  error, 
  placeholder, 
  maxLength, 
  autoComplete,
  className = '',
  ...props 
}) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        className={`form-control ${error ? 'form-control--error' : ''} ${className}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete={autoComplete}
        {...props}
      />
      {error && <span className="campo-error">{error}</span>}
    </div>
  )
}

export default Input