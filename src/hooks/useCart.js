import { useEffect, useRef, useState } from "react"
import { agregarProductoAlCarrito } from "../services/cartService"

function useCart() {
  const [agregando, setAgregando] = useState(false)
  const [agregado, setAgregado] = useState(false)
  const [errorCarrito, setErrorCarrito] = useState("")

  const temporizadorRef = useRef(null)

  useEffect(() => {
    return () => {
      if (temporizadorRef.current) {
        clearTimeout(temporizadorRef.current)
      }
    }
  }, [])

  async function agregarAlCarrito(
    producto,
    cantidad = 1
  ) {
    if (!producto?.id_prod) {
      setErrorCarrito(
        "No fue posible identificar el producto."
      )

      return {
        ok: false,
      }
    }

    if (
      !Number.isInteger(Number(cantidad)) ||
      Number(cantidad) < 1
    ) {
      setErrorCarrito(
        "La cantidad debe ser mayor o igual a 1."
      )

      return {
        ok: false,
      }
    }

    setAgregando(true)
    setAgregado(false)
    setErrorCarrito("")

    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current)
    }

    try {
      const resultado =
        await agregarProductoAlCarrito(
          producto,
          Number(cantidad)
        )

      setAgregado(true)

      temporizadorRef.current = setTimeout(() => {
        setAgregado(false)
      }, 2000)

      return {
        ok: true,
        ...resultado,
      }
    } catch (error) {
      console.error(
        "Error al agregar el producto al carrito:",
        error
      )

      setErrorCarrito(
        error.message || "No fue posible agregar el producto."
      )

      temporizadorRef.current = setTimeout(() => {
        setErrorCarrito("")
      }, 3000)

      return {
        ok: false,
        error,
      }
    } finally {
      setAgregando(false)
    }
  }

  return {
    agregando,
    agregado,
    errorCarrito,
    agregarAlCarrito,
  }
}

export default useCart