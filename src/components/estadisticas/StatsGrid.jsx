import StatsCard from './StatsCard'

const StatsGrid = ({ stats }) => {
  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
}

export default StatsGrid