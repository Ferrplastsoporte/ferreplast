import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  actualizarCantidadCarrito,
  eliminarProductoCarrito,
  obtenerProductosCarrito,
  obtenerUsuarioActual,
  vaciarCarrito,
} from "../services/cartService";
import { obtenerTiposDespachoActivos } from "../services/despachoService";
import {
  esPuertoMontt,
  obtenerOpcionesDespachoDisponibles,
  obtenerDespachoAutomatico,
  calcularCostoDespacho,
  requiereCoordinacionDespacho,
} from "../utils/despachoUtils";

function useCartView() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [idComuna, setIdComuna] = useState(null);
  const [tiposDespacho, setTiposDespacho] = useState([]);
  const [idTipoDespachoSeleccionado, setIdTipoDespachoSeleccionado] =
    useState(null);

  /* =======================================================
     CARGAR CARRITO Y DATOS DE DESPACHO
  ======================================================= */
  const cargarCarrito = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const usuarioActual = await obtenerUsuarioActual();

      setUsuario(usuarioActual);

      const carrito = await obtenerProductosCarrito();

      setProductos(carrito);
      if (!usuarioActual) {
        setIdComuna(null);
        setTiposDespacho([]);
        setIdTipoDespachoSeleccionado(null);

        return;
      }

      const [resultadoUsuario, tiposDespachoActivos] = await Promise.all([
        supabase
          .from("usuario")
          .select("id_comuna")
          .eq("id_user", usuarioActual.id)
          .single(),

        obtenerTiposDespachoActivos(),
      ]);
      if (resultadoUsuario.error) {
        throw resultadoUsuario.error;
      }
      setIdComuna(resultadoUsuario.data?.id_comuna ?? null);

      setTiposDespacho(tiposDespachoActivos);
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

  /* =======================================================
     OPCIONES DE DESPACHO DISPONIBLES
  ======================================================= */
  const opcionesDespacho = useMemo(() => {
    if (!usuario || !idComuna) {
      return [];
    }
    return obtenerOpcionesDespachoDisponibles(idComuna, tiposDespacho);
  }, [usuario, idComuna, tiposDespacho]);

  /* =======================================================
     DESPACHO AUTOMÁTICO FUERA DE PUERTO MONTT
  ======================================================= */
  useEffect(() => {
    if (!usuario || !idComuna || tiposDespacho.length === 0) {
      setIdTipoDespachoSeleccionado(null);
      return;
    }
    if (esPuertoMontt(idComuna)) {
      setIdTipoDespachoSeleccionado((idActual) => {
        const opcionSigueDisponible = opcionesDespacho.some(
          (tipo) => Number(tipo.id_tipo_despacho) === Number(idActual),
        );
        return opcionSigueDisponible ? idActual : null;
      });
      return;
    }
    const despachoAutomatico = obtenerDespachoAutomatico(
      idComuna,
      tiposDespacho,
    );
    setIdTipoDespachoSeleccionado(despachoAutomatico?.id_tipo_despacho ?? null);
  }, [usuario, idComuna, tiposDespacho, opcionesDespacho]);

  /* =======================================================
     DESPACHO SELECCIONADO
  ======================================================= */
  const despachoSeleccionado = useMemo(() => {
    if (!idTipoDespachoSeleccionado) {
      return null;
    }
    return (
      tiposDespacho.find(
        (tipo) =>
          Number(tipo.id_tipo_despacho) === Number(idTipoDespachoSeleccionado),
      ) ?? null
    );
  }, [tiposDespacho, idTipoDespachoSeleccionado]);

  /* =======================================================
     SELECCIONAR DESPACHO
  ======================================================= */
  function seleccionarTipoDespacho(idTipoDespacho) {
    if (!usuario || !idComuna) {
      return;
    }
    if (!esPuertoMontt(idComuna)) {
      return;
    }
    const idSeleccionado = Number(idTipoDespacho);
    const opcionValida = opcionesDespacho.some(
      (tipo) => Number(tipo.id_tipo_despacho) === idSeleccionado,
    );
    if (!opcionValida) {
      return;
    }
    setIdTipoDespachoSeleccionado(idSeleccionado);
  }

  /* =======================================================
     ACTUALIZAR CANTIDAD
  ======================================================= */
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

  /* =======================================================
     ELIMINAR PRODUCTO
  ======================================================= */
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

  /* =======================================================
     VACIAR CARRITO
  ======================================================= */
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

  /* =======================================================
     SUBTOTAL
  ======================================================= */
  const subtotal = useMemo(() => {
    return productos.reduce((acumulado, producto) => {
      const precioActual = Number(producto.precio_act);
      const precioNormal = Number(producto.precio_prod);
      const precio = precioActual > 0 ? precioActual : precioNormal || 0;
      const cantidad = Number(producto.cantidad) || 0;
      return acumulado + precio * cantidad;
    }, 0);
  }, [productos]);

  /* =======================================================
     COSTO DE ENVÍO
  ======================================================= */
  const envio = useMemo(() => {
    if (productos.length === 0) {
      return 0;
    }

    if (!despachoSeleccionado) {
      return 0;
    }

    return calcularCostoDespacho(despachoSeleccionado);
  }, [productos, despachoSeleccionado]);

  /* =======================================================
     COORDINACIÓN POSTERIOR
  ======================================================= */
  const requiereCoordinacion = useMemo(() => {
    return requiereCoordinacionDespacho(despachoSeleccionado);
  }, [despachoSeleccionado]);

  /* =======================================================
     TOTAL
  ======================================================= */
  const total = subtotal + envio;

  /* =======================================================
     VALIDAR SI EL DESPACHO ESTÁ LISTO
  ======================================================= */
  const despachoListo = useMemo(() => {
    if (!usuario) {
      return false;
    }
    if (!idComuna) {
      return false;
    }
    return despachoSeleccionado !== null;
  }, [usuario, idComuna, despachoSeleccionado]);

  return {
    productos,
    cargando,
    actualizando,
    error,
    usuario,
    idComuna,
    tiposDespacho,
    opcionesDespacho,
    idTipoDespachoSeleccionado,
    despachoSeleccionado,
    despachoListo,
    requiereCoordinacion,
    subtotal,
    envio,
    total,

    seleccionarTipoDespacho,
    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
    recargarCarrito: cargarCarrito,
  };
}

export default useCartView;
