import { useSearchParams, Link } from "react-router-dom";
import "./CSS/PagoResultado.css";

function PagoResultado() {
  const [params] = useSearchParams();
  const estado = params.get("estado");

  const mensajes = {
    aprobado: "Pago aprobado correctamente.",
    rechazado: "El pago fue rechazado.",
    cancelado: "El pago fue cancelado.",
    error: "Ocurrió un error al procesar el pago.",
  };

  return (
    <main className={`pago-resultado ${estado || "desconocido"}`}>
      <div className="pago-card">

        <div className="pago-icono">
          {estado === "aprobado" && "✓"}
          {estado === "rechazado" && "✕"}
          {estado === "cancelado" && "!"}
          {estado === "error" && "!"}
          {!mensajes[estado] && "?"}
        </div>

        <h1>Resultado del pago</h1>

        <p>
          {mensajes[estado] || "Estado de pago no disponible."}
        </p>

        <Link to="/carrito" className="pago-boton">
          Volver al carrito
        </Link>

      </div>
    </main>
  );
}

export default PagoResultado;