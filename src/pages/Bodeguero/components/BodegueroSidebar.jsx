import { Link, useLocation } from 'react-router-dom'

function BodegueroSidebar() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <aside className="admin-sidebar">
      <h2>FERREPLAST</h2>
      <p style={{ textAlign: 'center', fontSize: '14px', color: '#dce6ff', marginBottom: '20px' }}>
        👨‍🏭 Bodeguero
      </p>
      <nav>
        <Link to="/bodeguero" className={isActive('/bodeguero')}>
          📊 Dashboard
        </Link>
        <Link to="/bodeguero/productos" className={isActive('/bodeguero/productos')}>
          📦 Productos
        </Link>
        <Link to="/bodeguero/stock" className={isActive('/bodeguero/stock')}>
          📊 Stock
        </Link>
        <Link to="/bodeguero/solicitudes" className={isActive('/bodeguero/solicitudes')}>
          ⏳ Solicitudes
        </Link>
        <Link to="/bodeguero/familias" className={isActive('/bodeguero/familias')}>
          🏷️ Familias
        </Link>
        <Link to="/bodeguero/subcategorias" className={isActive('/bodeguero/subcategorias')}>
          📂 Subcategorías
        </Link>
        <Link to="/bodeguero/marcas" className={isActive('/bodeguero/marcas')}>
          🏢 Marcas
        </Link>
        <Link to="/bodeguero/unidades" className={isActive('/bodeguero/unidades')}>
          📏 Unidades
        </Link>
      </nav>
    </aside>
  )
}

export default BodegueroSidebar