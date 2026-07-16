import { useEffect, useState } from "react";
import { FaWhatsapp, FaArrowUp } from "react-icons/fa";
import "./css/floatingButtons.css";

function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="floating-buttons">

      {showTop && (
        <button
          className="top-button"
          onClick={scrollTop}
        >
          <FaArrowUp />
        </button>
      )}

      <a
        href="https://wa.me/56912345678?text=Hola,%20me%20gustaría%20cotizar%20algunos%20productos."
        target="_blank"
        rel="noreferrer"
        className="whatsapp-button"
      >
        <FaWhatsapp />

        <span>
          ¿Necesitas ayuda?
        </span>

      </a>

    </div>
  );
}

export default FloatingButtons;