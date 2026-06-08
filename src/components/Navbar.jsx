import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>Ferreplast</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Catálogo</Link>
        <Link to="/admin/productos" style={styles.link}>Subir Producto</Link>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#2c3e50',
    color: 'white'
  },
  logo: {
    margin: 0
  },
  links: {
    display: 'flex',
    gap: '1.5rem'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1rem'
  }
}

export default Navbar