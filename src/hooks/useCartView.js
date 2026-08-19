import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

import {
  actualizarCantidadCarrito,
  eliminarProductoCarrito,
  obtenerProductosCarrito,
  obtenerUsuarioActual,
  vaciarCarrito,
} from "../services/cartService";

const COSTO_ENVIO_PUERTO_MONTT = 5990;
const ID_COMUNA_PUERTO_MONTT = 313;

function useCartView() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const [usuario, setUsuario] = useState(null);
  const [idComuna, setIdComuna] = useState(null);

  const cargarCarrito = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const usuarioActual = await obtenerUsuarioActual();

      setUsuario(usuarioActual);

      const carrito = await obtenerProductosCarrito();

      setProductos(carrito);

      // Si no hay sesión, todavía no podemos
      // determinar el tipo de despacho.
      if (!usuarioActual) {
        setIdComuna(null);
        return;
      }

      // Obtenemos solamente la comuna necesaria
      // para determinar el despacho.
      const { data: datosUsuario, error: errorUsuario } = await supabase
        .from("usuario")
        .select("id_comuna")
        .eq("id_user", usuarioActual.id)
        .single();

      if (errorUsuario) {
        throw errorUsuario;
      }

      setIdComuna(datosUsuario?.id_comuna ?? null);
    } catch (errorCarga) {
      console.error("Error al cargar el carrito:", errorCarga);

      setError("No fue posible cargar el carrito.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito]);

  async function cambiarCantidad(idProducto, nuevaCantidad) {
    if (nuevaCantidad < 1) {
      return;
    }

    setActualizando(true);
    setError("");

    try {
      const carritoActualizado = await actualizarCantidadCarrito(
        idProducto,
        nuevaCantidad,
      );

      setProductos(carritoActualizado);
    } catch (errorActualizacion) {
      console.error("Error al actualizar la cantidad:", errorActualizacion);

      setError(
        "Superaste el stock disponible. No fue posible actualizar la cantidad.",
      );
    } finally {
      setActualizando(false);
    }
  }

  async function eliminarProducto(idProducto) {
    setActualizando(true);
    setError("");

    try {
      const carritoActualizado = await eliminarProductoCarrito(idProducto);

      setProductos(carritoActualizado);
    } catch (errorEliminacion) {
      console.error("Error al eliminar el producto:", errorEliminacion);

      setError("No fue posible eliminar el producto.");
    } finally {
      setActualizando(false);
    }
  }

  async function vaciarCarritoCompleto() {
    setActualizando(true);
    setError("");

    try {
      await vaciarCarrito();
      setProductos([]);
    } catch (errorVaciado) {
      console.error("Error al vaciar el carrito:", errorVaciado);

      setError("No fue posible vaciar el carrito.");
    } finally {
      setActualizando(false);
    }
  }

  const subtotal = useMemo(() => {
    return productos.reduce((acumulado, producto) => {
      const precioActual = Number(producto.precio_act);

      const precioNormal = Number(producto.precio_prod);

      const precio = precioActual > 0 ? precioActual : precioNormal || 0;

      const cantidad = Number(producto.cantidad) || 0;

      return acumulado + precio * cantidad;
    }, 0);
  }, [productos]);

  const tipoDespacho = useMemo(() => {
    if (!usuario || idComuna === null) {
      return null;
    }

    return Number(idComuna) !== ID_COMUNA_PUERTO_MONTT;
  }, [usuario, idComuna]);

  const envio = useMemo(() => {
    if (productos.length === 0) {
      return 0;
    }

    if (tipoDespacho === false) {
      return COSTO_ENVIO_PUERTO_MONTT;
    }

    return 0;
  }, [productos, tipoDespacho]);

  const total = subtotal + envio;

  return {
    productos,
    cargando,
    actualizando,
    error,

    usuario,
    idComuna,
    tipoDespacho,

    subtotal,
    envio,
    total,

    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
    recargarCarrito: cargarCarrito,
  };
}

export default useCartView;
