import { useState } from "react"
import useCarrito from "../../hooks/useCarrito"
import ModalCantidad from "../ui/ModalCantidad"
import "../css/BotonAgregarCarrito.css"

function BotonAgregarCarrito({
  producto,
  stockDisponible = 0,
  className = "",
  texto = "Agregar al carrito",
  disabled = false,
  onAgregado,
}) {
  const {
    agregando,
    agregado,
    errorCarrito,
    agregarAlCarrito,
  } = useCarrito()

  const [mostrarCantidad, setMostrarCantidad] =
    useState(false)

  const [cantidad, setCantidad] = useState(1)

  const stock = Math.max(
    0,
    Number(stockDisponible) || 0
  )

  const sinStock = stock <= 0

  function abrirSelector(evento) {
    evento.stopPropagation()

    if (
      disabled ||
      sinStock ||
      agregando
    ) {
      return
    }

    setCantidad(1)
    setMostrarCantidad(true)
  }

  function cerrarSelector() {
    if (agregando) {
      return
    }

    setMostrarCantidad(false)
    setCantidad(1)
  }

  async function agregar() {
    const cantidadValidada = Number(cantidad)

    if (
      !Number.isInteger(cantidadValidada) ||
      cantidadValidada < 1 ||
      cantidadValidada > stock
    ) {
      return
    }

    const resultado = await agregarAlCarrito(
      producto,
      cantidadValidada
    )

    if (!resultado.ok) {
      return
    }

    setMostrarCantidad(false)
    setCantidad(1)

    if (onAgregado) {
      onAgregado(resultado)
    }
  }

  function obtenerTextoBoton() {
    if (agregando) {
      return "Agregando..."
    }

    if (agregado) {
      return "✓ Agregado"
    }

    if (sinStock) {
      return "Sin stock"
    }

    return texto
  }

  return (
    <div
      className="add-to-cart add-cotizacion"
      onClick={(evento) =>
        evento.stopPropagation()
      }
    >
      <button
        type="button"
        className={`${className} ${
          agregado
            ? "add-to-cart__button--success"
            : ""
        }`}
        onClick={abrirSelector}
        disabled={
          disabled ||
          sinStock ||
          agregando
        }
      >
        {obtenerTextoBoton()}
      </button>
      
      <div className="add-to-cart__modal">
        {mostrarCantidad && (
          <ModalCantidad
            titulo="Cantidad para agregar"
            nombreProducto={producto.nom_prod}
            stockDisponible={stock}
            cantidad={cantidad}
            onCantidadChange={setCantidad}
            onCancelar={cerrarSelector}
            onConfirmar={agregar}
            textoConfirmar="Agregar"
            procesando={agregando}
          />
        )}
      </div>
      
      {errorCarrito && (
        <p
          className="add-to-cart__error"
          role="alert"
        >
          {errorCarrito}
        </p>
      )}
    </div>
  )
}

export default BotonAgregarCarrito
