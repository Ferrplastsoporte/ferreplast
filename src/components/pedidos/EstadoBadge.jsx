const EstadoBadge = ({ estado }) => {
  const estados = {
    pendiente: { label: '⏳ Pendiente', className: 'estado-pendiente' },
    en_preparacion: { label: '🔧 En preparación', className: 'estado-preparacion' },
    despachado: { label: '🚚 Despachado', className: 'estado-despachado' },
    entregado: { label: '✅ Entregado', className: 'estado-entregado' }
  }

  const info = estados[estado] || { label: estado, className: '' }

  return <span className={`estado-badge ${info.className}`}>{info.label}</span>
}

export default EstadoBadge