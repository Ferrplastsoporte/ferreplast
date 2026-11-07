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
  prefix,
  ...props 
}) => {
  const campo = (
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
        aria-describedby={prefix ? `${name}-prefijo` : undefined}
        {...props}
      />
  )

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      {prefix ? (
        <div className="input-con-prefijo">
          <span id={name + "-prefijo"}>{prefix}</span>
          {campo}
        </div>
      ) : campo}
      {error && <span className="campo-error">{error}</span>}
    </div>
  )
}

export default Input