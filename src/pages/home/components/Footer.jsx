import "../css/home.css";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* =========================
            MARCA
        ========================= */}
        <div className="footer-brand">

          <h2>FERREPLAST</h2>

          <p>
            Especialistas en resinas epóxicas,
            herramientas y materiales profesionales
            para tus proyectos.
          </p>

          <div className="socials">

            <a href="#" onClick={(e) => e.preventDefault()}>
              Facebook
            </a>

            <a href="#" onClick={(e) => e.preventDefault()}>
              Instagram
            </a>

            <a href="#" onClick={(e) => e.preventDefault()}>
              WhatsApp
            </a>

          </div>

        </div>


        {/* =========================
            NAVEGACIÓN
        ========================= */}
        <div className="footer-column">

          <h3>Navegación</h3>

          {/* Volver al Home */}
          <Link to="/">
            Inicio
          </Link>

          {/* Ir al catálogo */}
          <Link to="/catalogo">
            Catálogo
          </Link>

          {/* Ir al catálogo filtrado por familia */}
          <Link to="/catalogo?familia=Resinas">
            Resinas
          </Link>

          {/* Ir al catálogo filtrado por familia */}
          <Link to="/catalogo?familia=Herramientas">
            Herramientas
          </Link>

        </div>


        {/* =========================
            ATENCIÓN
        ========================= */}
        <div className="footer-column">

          <h3>Atención</h3>

          {/* Lleva a la sección Contacto del Home */}
          <Link to="/#contacto">
            Contacto
          </Link>

          <a href="#" onClick={(e) => e.preventDefault()}>
            Preguntas frecuentes
          </a>

          <a href="#" onClick={(e) => e.preventDefault()}>
            Políticas de compra
          </a>

          <a href="#" onClick={(e) => e.preventDefault()}>
            Términos y condiciones
          </a>

        </div>


        {/* =========================
            CONTACTO
        ========================= */}
        <div className="footer-column">

          <h3>Contacto</h3>

          <p>📍 Chile</p>

          <p>📞 +56 9 XXXX XXXX</p>

          <p>✉ contacto@ferreplast.cl</p>

          <p>💳 Transbank</p>

          <p>🏦 Transferencia bancaria</p>

        </div>

      </div>


      {/* =========================
          COPYRIGHT
      ========================= */}
      <div className="footer-bottom">

        <p>
          © 2026 Ferreplast. Todos los derechos reservados.
        </p>

      </div>

    </footer>
  );
}

export default Footer;