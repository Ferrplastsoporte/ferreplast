import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>Ferreplast</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Catálogo</Link>
        <Link to="/admin/productos" style={styles.link}>Subir Producto</Link>
        
        {/* NUEVO ENLACE AL CARRITO */}
        <Link to="/carrito" style={styles.linkCarrito}>
          Ver Carrito 🛒
        </Link>
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
    alignItems: 'center', // Alinea el nuevo botón con los demás links
    gap: '1.5rem'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1rem'
  },
  // ESTILO PARA EL BOTÓN DEL CARRITO
  linkCarrito: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1rem',
    backgroundColor: '#e67e22', // Color naranja llamativo estilo ferretería/e-commerce
    padding: '0.4rem 0.8rem',
    borderRadius: '5px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  }
}

export default Navbar