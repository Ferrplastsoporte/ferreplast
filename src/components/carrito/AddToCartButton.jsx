import useCart from "../../hooks/useCart";

function AddToCartButton({
  producto,
  cantidad = 1,
  className = "",
  texto = "Agregar al carrito",
  disabled = false,
  onAgregado,
}) {
  const { agregando, agregado, errorCarrito, agregarAlCarrito } = useCart();

  async function manejarAgregar(event) {
    event.stopPropagation();

    const resultado = await agregarAlCarrito(producto, cantidad);

    if (resultado.ok && onAgregado) {
      onAgregado(resultado);
    }
  }

  function obtenerTextoBoton() {
    if (agregando) {
      return "Agregando...";
    }

    if (agregado) {
      return "✓ Agregado";
    }

    return texto;
  }

  return (
    <div className="add-to-cart">
      <button
        type="button"
        className={`${className} ${
          agregado ? "add-to-cart__button--success" : ""
        }`}
        onClick={manejarAgregar}
        disabled={disabled || agregando}
      >
        {obtenerTextoBoton()}
      </button>

      {errorCarrito && (
        <p className="add-to-cart__error" role="alert">
          {errorCarrito}
        </p>
      )}
    </div>
  );
}

export default AddToCartButton;
