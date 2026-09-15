import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  actualizarCantidadCarrito,
  eliminarProductoCarrito,
  obtenerProductosCarrito,
  obtenerUsuarioActual,
  vaciarCarrito,
} from "../services/carritoService";

import { obtenerTiposDespachoActivos } from "../services/despachoService";

import {
  esPuertoMontt,
  obtenerOpcionesDespachoDisponibles,
  obtenerDespachoAutomatico,
  calcularCostoDespacho,
  requiereCoordinacionDespacho,
} from "../utils/utilidadesDespacho";

function useVistaCarrito() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState(null);

  // =======================================================
  // DATOS ORIGINALES DEL USUARIO
  // =======================================================

  const [idComuna, setIdComuna] = useState(null);
  const [direccionUsuario, setDireccionUsuario] = useState("");

  // =======================================================
  // DATOS DE DESPACHO DEL PEDIDO ACTUAL
  // =======================================================

  const [idComunaDespacho, setIdComunaDespacho] = useState(null);
  const [direccionDespacho, setDireccionDespacho] = useState("");
  const [editandoDireccion, setEditandoDireccion] = useState(false);

  // =======================================================
  // TIPOS DE DESPACHO
  // =======================================================

  const [tiposDespacho, setTiposDespacho] = useState([]);
  const [idTipoDespachoSeleccionado, setIdTipoDespachoSeleccionado] =
    useState(null);

  // =======================================================
  // CARGAR CARRITO Y DATOS DEL USUARIO
  // =======================================================

  const cargarCarrito = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const usuarioActual = await obtenerUsuarioActual();

      setUsuario(usuarioActual);

      const carrito = await obtenerProductosCarrito();

      setProductos(carrito);

      // ---------------------------------------------------
      // USUARIO NO AUTENTICADO
      // ---------------------------------------------------

      if (!usuarioActual) {
        setIdComuna(null);
        setDireccionUsuario("");
        setIdComunaDespacho(null);
        setDireccionDespacho("");
        setEditandoDireccion(false);
        setTiposDespacho([]);
        setIdTipoDespachoSeleccionado(null);

        return;
      }

      // ---------------------------------------------------
      // CARGAR DATOS DEL USUARIO Y TIPOS DE DESPACHO
      // ---------------------------------------------------

      const [resultadoUsuario, tiposDespachoActivos] =
        await Promise.all([
          supabase
            .from("usuario")
            .select("id_comuna, direc_user")
            .eq("id_user", usuarioActual.id)
            .single(),

          obtenerTiposDespachoActivos(),
        ]);

      if (resultadoUsuario.error) {
        throw resultadoUsuario.error;
      }

      const comunaUsuario =
        resultadoUsuario.data?.id_comuna ?? null;

      const direccionUsuarioActual =
        resultadoUsuario.data?.direc_user ?? "";

      // ---------------------------------------------------
      // DATOS ORIGINALES DEL PERFIL
      // ---------------------------------------------------

      setIdComuna(comunaUsuario);
      setDireccionUsuario(direccionUsuarioActual);

      // ---------------------------------------------------
      // DATOS INICIALES DEL PEDIDO
      // ---------------------------------------------------

      setIdComunaDespacho(comunaUsuario);
      setDireccionDespacho(direccionUsuarioActual);

      setTiposDespacho(tiposDespachoActivos);
    } catch (errorCarga) {
      console.error(
        "Error al cargar el carrito:",
        errorCarga
      );

      setError(
        "No fue posible cargar la información del carrito."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCarrito();
  }, [cargarCarrito]);

  // =======================================================
  // OPCIONES DE DESPACHO DISPONIBLES
  // =======================================================

  const opcionesDespacho = useMemo(() => {
    if (!usuario || !idComuna) {
      return [];
    }

    return obtenerOpcionesDespachoDisponibles(
      idComuna,
      tiposDespacho
    );
  }, [usuario, idComuna, tiposDespacho]);

  // =======================================================
  // DESPACHO AUTOMÁTICO FUERA DE PUERTO MONTT
  // =======================================================

  useEffect(() => {
    if (
      !usuario ||
      !idComuna ||
      tiposDespacho.length === 0
    ) {
      setIdTipoDespachoSeleccionado(null);
      return;
    }

    // ---------------------------------------------------
    // USUARIO EN PUERTO MONTT
    // ---------------------------------------------------

    if (esPuertoMontt(idComuna)) {
      setIdTipoDespachoSeleccionado((idActual) => {
        const opcionSigueDisponible =
          opcionesDespacho.some(
            (tipo) =>
              Number(tipo.id_tipo_despacho) ===
              Number(idActual)
          );

        return opcionSigueDisponible ? idActual : null;
      });

      return;
    }

    // ---------------------------------------------------
    // USUARIO FUERA DE PUERTO MONTT
    // ---------------------------------------------------

    const despachoAutomatico =
      obtenerDespachoAutomatico(
        idComuna,
        tiposDespacho
      );

    setIdTipoDespachoSeleccionado(
      despachoAutomatico?.id_tipo_despacho ?? null
    );
  }, [
    usuario,
    idComuna,
    tiposDespacho,
    opcionesDespacho,
  ]);

  // =======================================================
  // DESPACHO SELECCIONADO
  // =======================================================

  const despachoSeleccionado = useMemo(() => {
    if (!idTipoDespachoSeleccionado) {
      return null;
    }

    return (
      tiposDespacho.find(
        (tipo) =>
          Number(tipo.id_tipo_despacho) ===
          Number(idTipoDespachoSeleccionado)
      ) ?? null
    );
  }, [
    tiposDespacho,
    idTipoDespachoSeleccionado,
  ]);

  // =======================================================
  // TIPO DE DESPACHO
  // =======================================================

  const esRetiroTienda = useMemo(() => {
    if (!despachoSeleccionado) {
      return false;
    }

    return (
      despachoSeleccionado.nom_tipo_despacho
        ?.toLowerCase()
        .includes("retiro") ?? false
    );
  }, [despachoSeleccionado]);

  const esDespachoUrbano = useMemo(() => {
    if (!despachoSeleccionado) {
      return false;
    }

    return (
      despachoSeleccionado.nom_tipo_despacho
        ?.toLowerCase()
        .includes("urbano") ?? false
    );
  }, [despachoSeleccionado]);

  const esDespachoAledano = useMemo(() => {
    if (!despachoSeleccionado) {
      return false;
    }

    return (
      despachoSeleccionado.nom_tipo_despacho
        ?.toLowerCase()
        .includes("aledaño") ?? false
    );
  }, [despachoSeleccionado]);

  // =======================================================
  // SELECCIONAR TIPO DE DESPACHO
  // =======================================================

  function seleccionarTipoDespacho(idSeleccionado) {
    if (!usuario || !idComuna) {
      return;
    }

    // Si está fuera de Puerto Montt,
    // el despacho se determina automáticamente.
    if (!esPuertoMontt(idComuna)) {
      return;
    }

    const existeOpcion = opcionesDespacho.some(
      (tipo) =>
        Number(tipo.id_tipo_despacho) ===
        Number(idSeleccionado)
    );

    if (!existeOpcion) {
      return;
    }

    setIdTipoDespachoSeleccionado(
      Number(idSeleccionado)
    );

    setError("");
  }

  // =======================================================
  // EDICIÓN DE DIRECCIÓN
  // =======================================================

  function iniciarEdicionDireccion() {
    if (
      !despachoSeleccionado ||
      esRetiroTienda
    ) {
      return;
    }

    setEditandoDireccion(true);
    setError("");
  }

  function cancelarEdicionDireccion() {
    setDireccionDespacho(direccionUsuario);
    setIdComunaDespacho(idComuna);
    setEditandoDireccion(false);
    setError("");
  }

  function actualizarDireccionDespacho(valor) {
    setDireccionDespacho(valor);
  }

  function actualizarComunaDespacho(valor) {
    const nuevaComuna = Number(valor);

    if (!nuevaComuna) {
      return;
    }

    // ---------------------------------------------------
    // DESPACHO URBANO
    // Solamente Puerto Montt
    // ---------------------------------------------------

    if (
      esDespachoUrbano &&
      !esPuertoMontt(nuevaComuna)
    ) {
      return;
    }

    setIdComunaDespacho(nuevaComuna);
  }

  function confirmarDireccionDespacho() {
    if (!direccionDespacho.trim()) {
      setError(
        "Ingresa una dirección de despacho."
      );

      return false;
    }

    if (!idComunaDespacho) {
      setError(
        "Selecciona una comuna de despacho."
      );

      return false;
    }

    // ---------------------------------------------------
    // URBANO SOLAMENTE PUERTO MONTT
    // ---------------------------------------------------

    if (
      esDespachoUrbano &&
      !esPuertoMontt(idComunaDespacho)
    ) {
      setError(
        "El despacho urbano está disponible solamente dentro de Puerto Montt urbano."
      );

      return false;
    }

    setError("");
    setEditandoDireccion(false);

    return true;
  }

  // =======================================================
  // ACTUALIZAR CANTIDAD
  // =======================================================

  async function cambiarCantidad(
    idProducto,
    nuevaCantidad
  ) {
    if (nuevaCantidad < 1) {
      return;
    }

    setActualizando(true);
    setError("");

    try {
      const carritoActualizado =
        await actualizarCantidadCarrito(
          idProducto,
          nuevaCantidad
        );

      setProductos(carritoActualizado);
    } catch (errorActualizacion) {
      console.error(
        "Error al actualizar la cantidad:",
        errorActualizacion
      );

      setError(
        "Superaste el stock disponible. No fue posible actualizar la cantidad."
      );
    } finally {
      setActualizando(false);
    }
  }

  // =======================================================
  // ELIMINAR PRODUCTO
  // =======================================================

  async function eliminarProducto(idProducto) {
    setActualizando(true);
    setError("");

    try {
      const carritoActualizado =
        await eliminarProductoCarrito(
          idProducto
        );

      setProductos(carritoActualizado);
    } catch (errorEliminacion) {
      console.error(
        "Error al eliminar el producto:",
        errorEliminacion
      );

      setError(
        "No fue posible eliminar el producto."
      );
    } finally {
      setActualizando(false);
    }
  }

  // =======================================================
  // VACIAR CARRITO
  // =======================================================

  async function vaciarCarritoCompleto() {
    setActualizando(true);
    setError("");

    try {
      await vaciarCarrito();

      setProductos([]);
    } catch (errorVaciado) {
      console.error(
        "Error al vaciar el carrito:",
        errorVaciado
      );

      setError(
        "No fue posible vaciar el carrito."
      );
    } finally {
      setActualizando(false);
    }
  }

  // =======================================================
  // SUBTOTAL
  // =======================================================

  const subtotal = useMemo(() => {
    return productos.reduce(
      (acumulado, producto) => {
        const precioActual =
          Number(producto.precio_act);

        const precioNormal =
          Number(producto.precio_prod);

        const precio =
          precioActual > 0
            ? precioActual
            : precioNormal || 0;

        const cantidad =
          Number(producto.cantidad) || 0;

        return (
          acumulado +
          precio * cantidad
        );
      },
      0
    );
  }, [productos]);

  // =======================================================
  // COSTO DE ENVÍO
  // =======================================================

  const envio = useMemo(() => {
    if (productos.length === 0) {
      return 0;
    }

    if (!despachoSeleccionado) {
      return 0;
    }

    return calcularCostoDespacho(
      despachoSeleccionado
    );
  }, [
    productos,
    despachoSeleccionado,
  ]);

  // =======================================================
  // COORDINACIÓN POSTERIOR
  // =======================================================

  const requiereCoordinacion = useMemo(() => {
    return requiereCoordinacionDespacho(
      despachoSeleccionado
    );
  }, [despachoSeleccionado]);

  // =======================================================
  // TOTAL
  // =======================================================

  const total = subtotal + envio;

  // =======================================================
  // VALIDAR SI EL DESPACHO ESTÁ LISTO
  // =======================================================

  const despachoListo = useMemo(() => {
    if (!usuario) {
      return false;
    }

    if (!idComunaDespacho) {
      return false;
    }

    if (!despachoSeleccionado) {
      return false;
    }

    // Retiro en tienda no necesita dirección
    if (esRetiroTienda) {
      return true;
    }

    // Los despachos necesitan dirección
    if (!direccionDespacho.trim()) {
      return false;
    }

    // Urbano solamente permite Puerto Montt
    if (
      esDespachoUrbano &&
      !esPuertoMontt(idComunaDespacho)
    ) {
      return false;
    }

    return true;
  }, [
    usuario,
    idComunaDespacho,
    despachoSeleccionado,
    direccionDespacho,
    esRetiroTienda,
    esDespachoUrbano,
  ]);

  // =======================================================
  // RETORNO
  // =======================================================

  return {
    // Carrito
    productos,
    cargando,
    actualizando,
    error,

    // Usuario
    usuario,

    // Datos originales del perfil
    idComuna,
    direccionUsuario,

    // Datos del despacho de ESTE pedido
    idComunaDespacho,
    direccionDespacho,
    editandoDireccion,

    // Tipos de despacho
    tiposDespacho,
    opcionesDespacho,
    idTipoDespachoSeleccionado,
    despachoSeleccionado,

    // Tipo de entrega
    esRetiroTienda,
    esDespachoUrbano,
    esDespachoAledano,

    // Estado del despacho
    despachoListo,
    requiereCoordinacion,

    // Totales
    subtotal,
    envio,
    total,

    // Selección de despacho
    seleccionarTipoDespacho,

    // Dirección del pedido
    iniciarEdicionDireccion,
    cancelarEdicionDireccion,
    actualizarDireccionDespacho,
    actualizarComunaDespacho,
    confirmarDireccionDespacho,

    // Carrito
    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,

    // Recargar
    recargarCarrito: cargarCarrito,
  };
}

export default useVistaCarrito;