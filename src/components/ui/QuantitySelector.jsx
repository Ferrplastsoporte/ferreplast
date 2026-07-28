import "../css/QuantitySelector.css"

function QuantitySelector({
  cantidad,
  minimo = 1,
  maximo,
  onChange,
  disabled = false,
}) {
  const limiteMaximo =
    maximo === null || maximo === undefined
      ? Infinity
      : Number(maximo)

  function validarCantidad(valor) {
    const numero = Number(valor)

    if (!Number.isFinite(numero)) {
      return minimo
    }

    return Math.min(
      limiteMaximo,
      Math.max(minimo, Math.trunc(numero))
    )
  }

  function disminuir(evento) {
    evento.stopPropagation()

    if (disabled) {
      return
    }

    onChange(validarCantidad(cantidad - 1))
  }

  function aumentar(evento) {
    evento.stopPropagation()

    if (disabled) {
      return
    }

    onChange(validarCantidad(cantidad + 1))
  }

  function cambiarCantidad(evento) {
    evento.stopPropagation()

    if (disabled) {
      return
    }

    const valor = evento.target.value

    if (valor === "") {
      onChange("")
      return
    }

    onChange(validarCantidad(valor))
  }

  function validarAlSalir() {
    if (cantidad === "") {
      onChange(minimo)
      return
    }

    onChange(validarCantidad(cantidad))
  }

  const noPuedeDisminuir =
    disabled || Number(cantidad) <= minimo

  const noPuedeAumentar =
    disabled ||
    Number(cantidad) >= limiteMaximo

  return (
    <div
      className="quantity-selector"
      onClick={(evento) =>
        evento.stopPropagation()
      }
    >
      <button
        type="button"
        className="quantity-selector__button"
        onClick={disminuir}
        disabled={noPuedeDisminuir}
        aria-label="Disminuir cantidad"
      >
        −
      </button>

      <input
        type="number"
        className="quantity-selector__input"
        min={minimo}
        max={
          Number.isFinite(limiteMaximo)
            ? limiteMaximo
            : undefined
        }
        value={cantidad}
        onChange={cambiarCantidad}
        onBlur={validarAlSalir}
        onClick={(evento) =>
          evento.stopPropagation()
        }
        disabled={disabled}
        aria-label="Cantidad"
      />

      <button
        type="button"
        className="quantity-selector__button"
        onClick={aumentar}
        disabled={noPuedeAumentar}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  )
}

export default QuantitySelector