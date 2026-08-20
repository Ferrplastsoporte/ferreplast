import { useSearchParams, Link } from "react-router-dom";

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
    <main className="cart-page">
      <h1>Resultado del pago</h1>

      <p>
        {mensajes[estado] || "Estado de pago no disponible."}
      </p>

      <Link to="/carrito">
        Volver al carrito
      </Link>
    </main>
  );
}

export default PagoResultado;