import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowUp, FaDollarSign, FaWhatsapp } from "react-icons/fa";

import { useAutenticacion } from "../../hooks/useAutenticacion";
import "../css/BotonesFlotantes.css";

function BotonesFlotantes() {
  const [showTop, setShowTop] = useState(false);

  const auth = useAutenticacion();

  const user = auth?.user || auth?.session?.user || null;

  const loading = auth?.loading || auth?.cargando || false;

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="floating-buttons">
      {showTop && (
        <button
          type="button"
          className="top-button"
          onClick={scrollTop}
          aria-label="Volver al inicio de la página"
          title="Volver arriba"
        >
          <FaArrowUp aria-hidden="true" />
        </button>
      )}

      {!loading && user && (
        <Link
          to="/cotizacion"
          className="cotizacion-button"
          aria-label="Ir a solicitud de cotización"
          title="Cotiza con nosotros"
        >
          <FaDollarSign aria-hidden="true" />

          <span>Cotiza con nosotros</span>
        </Link>
      )}

      <a
        href="https://wa.me/56912345678?text=Hola,%20me%20gustaría%20cotizar%20algunos%20productos."
        target="_blank"
        rel="noreferrer"
        className="whatsapp-button"
        aria-label="Contactar por WhatsApp"
        title="¿Necesitas ayuda?"
      >
        <FaWhatsapp aria-hidden="true" />

        <span>¿Necesitas ayuda?</span>
      </a>
    </div>
  );
}

export default BotonesFlotantes;
