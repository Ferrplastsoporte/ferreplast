import { Link, useNavigate } from "react-router-dom";

import "./css/pagina-no-encontrada.css";

function PaginaNoEncontrada() {
  const navigate = useNavigate();

  return (
    <main className="pagina-no-encontrada">
      <section className="pagina-no-encontrada__contenido">
        <p className="pagina-no-encontrada__codigo" aria-hidden="true">
          404
        </p>

        <p className="pagina-no-encontrada__etiqueta">Página no encontrada</p>

        <h1>No encontramos la dirección que buscas</h1>

        <p className="pagina-no-encontrada__descripcion">
          Es posible que el enlace haya cambiado o que la dirección esté
          escrita incorrectamente.
        </p>

        <div className="pagina-no-encontrada__acciones">
          <Link to="/" className="pagina-no-encontrada__inicio">
            Volver al inicio
          </Link>

          <button
            type="button"
            className="pagina-no-encontrada__volver"
            onClick={() => navigate(-1)}
          >
            Regresar
          </button>
        </div>
      </section>
    </main>
  );
}

export default PaginaNoEncontrada;
