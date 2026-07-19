const Select = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur, 
  error, 
  options, 
  disabled = false,
  placeholder,
  className = ''
}) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        name={name}
        className={`form-control ${error ? 'form-control--error' : ''} ${className}`}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
      >
        <option value="">{placeholder || 'Selecciona una opción'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.nombre}
          </option>
        ))}
      </select>
      {error && <span className="campo-error">{error}</span>}
    </div>
  )
}

export default Select