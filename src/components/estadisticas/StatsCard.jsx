const StatsCard = ({ titulo, valor, icono, color = 'blue' }) => {
  const colores = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="stats-card">
      {icono && <span className="stats-icon">{icono}</span>}
      <div className="stats-info">
        <h3 className="stats-titulo">{titulo}</h3>
        <p className="stats-valor">{valor}</p>
      </div>
    </div>
  )
}

export default StatsCard