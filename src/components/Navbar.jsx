import { Link } from "react-router-dom";
import {
  FaSearch,
  FaShoppingCart,
  FaUser,
  FaBars,
} from "react-icons/fa";

function Navbar() {
  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        FERREPLAST
      </Link>

      {/* Buscador */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Buscar productos..."
          style={styles.searchInput}
        />

        <button style={styles.searchButton}>
          <FaSearch />
        </button>
      </div>

      {/* Categorías */}
      <div style={styles.dropdown}>
        <details>
          <summary style={styles.summary}>
            <FaBars />
            Categorías
          </summary>

          <div style={styles.dropdownMenu}>
            <Link to="/catalogo" style={styles.dropdownItem}>
              📦 Catálogo
            </Link>

            <Link to="/resinas" style={styles.dropdownItem}>
              🧪 Resinas Epóxicas
            </Link>

            <Link to="/herramientas" style={styles.dropdownItem}>
              🛠 Herramientas
            </Link>

            <Link to="/pinturas" style={styles.dropdownItem}>
              🎨 Pinturas
            </Link>

            <Link to="/materiales" style={styles.dropdownItem}>
              🧱 Materiales
            </Link>

            <Link to="/tornillos" style={styles.dropdownItem}>
              🔩 Tornillos
            </Link>

            <Link to="/electricidad" style={styles.dropdownItem}>
              ⚡ Electricidad
            </Link>

            <Link to="/gasfiteria" style={styles.dropdownItem}>
              🚿 Gasfitería
            </Link>
          </div>
        </details>
      </div>

      {/* Usuario */}
      <Link to="/login" style={styles.icon}>
        <FaUser size={20} />
        <span>Iniciar sesión</span>
      </Link>

      {/* Carrito */}
      <Link to="/carrito" style={styles.icon}>
        <FaShoppingCart size={22} />
      </Link>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
    padding: "15px 40px",
    background: "#005BBB",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  logo: {
    color: "white",
    textDecoration: "none",
    fontSize: "30px",
    fontWeight: "bold",
    minWidth: "220px",
  },

  searchContainer: {
    display: "flex",
    flex: 1,
    background: "white",
    borderRadius: "30px",
    overflow: "hidden",
    height: "46px",
  },

  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "0 18px",
    fontSize: "16px",
  },

  searchButton: {
    width: "60px",
    border: "none",
    background: "white",
    color: "#005BBB",
    cursor: "pointer",
    fontSize: "18px",
  },

  dropdown: {
    position: "relative",
  },

  summary: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    listStyle: "none",
    color: "white",
    fontWeight: "600",
    padding: "10px",
    userSelect: "none",
  },

  dropdownMenu: {
    position: "absolute",
    top: "55px",
    right: 0,
    width: "240px",
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,.2)",
    overflow: "hidden",
  },

  dropdownItem: {
    display: "block",
    padding: "14px 18px",
    color: "#333",
    textDecoration: "none",
    borderBottom: "1px solid #eee",
    fontSize: "15px",
  },

  icon: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "white",
    textDecoration: "none",
    fontWeight: "500",
    whiteSpace: "nowrap",
  },
};

export default Navbar;