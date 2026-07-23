import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  actualizarCantidadCarrito,
  eliminarProductoCarrito,
  obtenerProductosCarrito,
  vaciarCarrito,
} from "../services/cartService"

const COSTO_ENVIO = 5990

function useCartView() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] =
    useState(false)
  const [error, setError] = useState("")

  const cargarCarrito = useCallback(async () => {
    setCargando(true)
    setError("")

    try {
      const carrito =
        await obtenerProductosCarrito()

      setProductos(carrito)
    } catch (errorCarga) {
      console.error(
        "Error al cargar el carrito:",
        errorCarga
      )

      setError(
        "No fue posible cargar el carrito."
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarCarrito()
  }, [cargarCarrito])

  async function cambiarCantidad(
    idProducto,
    nuevaCantidad
  ) {
    if (nuevaCantidad < 1) {
      return
    }

    setActualizando(true)
    setError("")

    try {
      const carritoActualizado =
        await actualizarCantidadCarrito(
          idProducto,
          nuevaCantidad
        )

      setProductos(carritoActualizado)
    } catch (errorActualizacion) {
      console.error(
        "Error al actualizar la cantidad:",
        errorActualizacion
      )

      setError(
        "No fue posible actualizar la cantidad."
      )
    } finally {
      setActualizando(false)
    }
  }

  async function eliminarProducto(idProducto) {
    setActualizando(true)
    setError("")

    try {
      const carritoActualizado =
        await eliminarProductoCarrito(
          idProducto
        )

      setProductos(carritoActualizado)
    } catch (errorEliminacion) {
      console.error(
        "Error al eliminar el producto:",
        errorEliminacion
      )

      setError(
        "No fue posible eliminar el producto."
      )
    } finally {
      setActualizando(false)
    }
  }

  async function vaciarCarritoCompleto() {
    setActualizando(true)
    setError("")

    try {
      await vaciarCarrito()
      setProductos([])
    } catch (errorVaciado) {
      console.error(
        "Error al vaciar el carrito:",
        errorVaciado
      )

      setError(
        "No fue posible vaciar el carrito."
      )
    } finally {
      setActualizando(false)
    }
  }

  const subtotal = useMemo(() => {
    return productos.reduce(
      (acumulado, producto) => {
        const precioActual =
          Number(producto.precio_act)

        const precioNormal =
          Number(producto.precio_prod)

        const precio =
          precioActual > 0
            ? precioActual
            : precioNormal || 0

        const cantidad =
          Number(producto.cantidad) || 0

        return (
          acumulado +
          precio * cantidad
        )
      },
      0
    )
  }, [productos])

  const envio =
    productos.length > 0
      ? COSTO_ENVIO
      : 0

  const total = subtotal + envio

  return {
    productos,
    cargando,
    actualizando,
    error,
    subtotal,
    envio,
    total,
    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
  }
}

export default useCartView