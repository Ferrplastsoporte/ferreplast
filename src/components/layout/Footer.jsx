import { Link } from "react-router-dom";
import {
  FaClock, FaEnvelope, FaFacebookF, FaInstagram,
  FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp,
} from "react-icons/fa";
import "../css/footer.css";
import logo from "../../assets/logo.png";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__contenedor">
        {/* Marca y canales sociales. No usar enlaces ficticios. */}
        <section className="footer__marca" aria-label="Ferreplast">
          <Link to="/" className="footer__logo" aria-label="Ferreplast, ir al inicio">
            <img src={logo} alt="Ferreplast" />
          </Link>
          <p className="footer__descripcion">
            Especialistas en resinas epóxicas, herramientas y materiales
            profesionales para tus proyectos.
          </p>
          <h3 className="footer__titulo-redes">Conecta con nosotros</h3>
          <div className="footer__redes">
            <a className="footer__red" href="https://www.facebook.com/ferreplast.spa/"
              target="_blank" rel="noopener noreferrer">
              <FaFacebookF aria-hidden="true" /> Facebook
            </a>
            <a className="footer__red" href="https://www.instagram.com/ferreplast_spa.cl/"
              target="_blank" rel="noopener noreferrer">
              <FaInstagram aria-hidden="true" /> Instagram
            </a>
            <a className="footer__red" href="https://wa.me/56954980237"
              target="_blank" rel="noopener noreferrer">
              <FaWhatsapp aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </section>

        {/* Rutas que ya existen en el proyecto. */}
        <nav className="footer__columna" aria-labelledby="footer-titulo-navegacion">
          <h3 id="footer-titulo-navegacion" className="footer__titulo">Explora Ferreplast</h3>
          <ul className="footer__enlaces">
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/catalogo">Catálogo de productos</Link></li>
            <li><Link to="/carrito">Mi carrito</Link></li>
            <li><Link to="/ayuda">Preguntas frecuentes</Link></li>
          </ul>
        </nav>

        {/* Datos de contacto utilizados actualmente en el home. */}
        <section className="footer__columna" aria-labelledby="footer-titulo-contacto">
          <h3 id="footer-titulo-contacto" className="footer__titulo">Hablemos</h3>
          <address className="footer__contacto">
            <a href="https://www.google.com/maps/search/?api=1&query=Angelm%C3%B3%201952%2C%20Puerto%20Montt%2C%20Chile"
              target="_blank" rel="noopener noreferrer" className="footer__dato">
              <FaMapMarkerAlt aria-hidden="true" />
              <span><strong>Visítanos</strong>Angelmó 1952<br />Puerto Montt, Región de Los Lagos</span>
            </a>
            <a href="tel:+56954980237" className="footer__dato">
              <FaPhoneAlt aria-hidden="true" />
              <span><strong>Llámanos</strong>+56 9 5498 0237</span>
            </a>
            <a href="https://mail.google.com/mail/?view=cm&fs=1&to=efuentes.m%40ferreplast.cl"
              target="_blank" rel="noopener noreferrer" className="footer__dato">
              <FaEnvelope aria-hidden="true" />
              <span><strong>Escríbenos</strong>efuentes.m@ferreplast.cl</span>
            </a>
          </address>
        </section>

        {/* Horario y medio de pago, agrupados para equilibrar el contenido. */}
        <section className="footer__columna" aria-labelledby="footer-titulo-atencion">
          <h3 id="footer-titulo-atencion" className="footer__titulo">Atención y pagos</h3>
          <div className="footer__dato">
            <FaClock aria-hidden="true" />
            <p><strong>Horario de tienda</strong>Lunes a viernes<br />09:00 a 18:00 hrs</p>
          </div>
          <div className="footer__pago">
            <div>
              <h4 className="footer__titulo-pagos">Medios de pago</h4>
              <ul className="footer__medios-pago">
                <li>Transbank</li>
                <li>Bci</li>
                <li>Banco de Chile</li>
              </ul>
            </div>
          </div>
          <Link to="/ayuda" className="footer__ayuda">¿Necesitas ayuda con tu compra?</Link>
        </section>
      </div>

      <div className="footer__inferior">
        <p>© {new Date().getFullYear()} Ferreplast. Todos los derechos reservados.</p>
        <span>Puerto Montt · Chile</span>
      </div>
    </footer>
  );
}

export default Footer;
