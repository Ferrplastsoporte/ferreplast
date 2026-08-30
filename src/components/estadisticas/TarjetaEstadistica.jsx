const TarjetaEstadistica = ({ titulo, valor, icono }) => {
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

export default TarjetaEstadistica
