function BodegueroHeader({ titulo }) {
  return (
    <header className="admin-header">
      <h1>{titulo}</h1>
      <div className="admin-header-user">
        <span>👨‍🏭 Bodeguero</span>
      </div>
    </header>
  )
}

export default BodegueroHeader