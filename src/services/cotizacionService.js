import { supabase } from "../lib/supabase";

const COTIZACION_KEY = "cotizacion_temporal";

const estadoInicial = {
  productosCatalogo: [],
  productosManuales: [],
  medioContacto: "",
  comentarioGeneral: "",
};

/*
 * Normaliza la estructura guardada de la cotización.
 * También permite recuperar versiones antiguas
 * que solo contenían un arreglo de productos.
 */
function normalizarCotizacion(valor) {
  if (Array.isArray(valor)) {
    return {
      ...estadoInicial,
      productosCatalogo: valor,
    };
  }

  return {
    productosCatalogo: Array.isArray(valor?.productosCatalogo)
      ? valor.productosCatalogo
      : [],

    productosManuales: Array.isArray(valor?.productosManuales)
      ? valor.productosManuales
      : [],

    medioContacto: String(valor?.medioContacto || ""),

    comentarioGeneral: String(valor?.comentarioGeneral || ""),
  };
}

/*
 * Valida únicamente que la cantidad
 * sea un número entero mayor o igual a 1.
 *
 * La cotización no se limita por el stock actual,
 * porque representa una solicitud comercial.
 */
function validarCantidad(cantidad) {
  const cantidadValidada = Number(cantidad);

  if (!Number.isInteger(cantidadValidada) || cantidadValidada < 1) {
    throw new Error("La cantidad debe ser mayor o igual a 1.");
  }

  return cantidadValidada;
}

/*
 * Obtiene la cotización completa desde localStorage.
 */
export function obtenerCotizacionCompleta() {
  try {
    const guardada = localStorage.getItem(COTIZACION_KEY);

    return guardada
      ? normalizarCotizacion(JSON.parse(guardada))
      : { ...estadoInicial };
  } catch (error) {
    console.error("Error al leer la cotización:", error);

    return { ...estadoInicial };
  }
}

/*
 * Guarda la cotización completa en localStorage.
 */
export function guardarCotizacionCompleta(cotizacion) {
  const normalizada = normalizarCotizacion(cotizacion);

  localStorage.setItem(COTIZACION_KEY, JSON.stringify(normalizada));

  return normalizada;
}

/*
 * Obtiene solamente los productos
 * seleccionados desde el catálogo.
 */
export function obtenerCotizacion() {
  return obtenerCotizacionCompleta().productosCatalogo;
}

/*
 * Guarda solamente los productos del catálogo,
 * conservando los demás datos de la cotización.
 */
export function guardarCotizacion(productos) {
  const cotizacion = obtenerCotizacionCompleta();

  cotizacion.productosCatalogo = Array.isArray(productos) ? productos : [];

  guardarCotizacionCompleta(cotizacion);

  return cotizacion.productosCatalogo;
}

/*
 * Agrega un producto del catálogo a la cotización.
 *
 * Si el producto ya existe, suma la cantidad.
 *
 * El stock se conserva como referencia informativa,
 * pero no limita la cantidad solicitada.
 */
export function agregarProductoCotizacion(producto) {
  if (!producto?.id_prod) {
    throw new Error("El producto no es válido.");
  }

  const cantidadNueva = validarCantidad(producto.cantidad);

  const stockActual = Math.max(0, Number(producto.stock_prod) || 0);

  const productos = obtenerCotizacion();

  const indice = productos.findIndex(
    (item) => Number(item.id_prod) === Number(producto.id_prod),
  );

  if (indice >= 0) {
    const productoActual = productos[indice];

    const cantidadActual = Number(productoActual.cantidad) || 0;

    const cantidadFinal = cantidadActual + cantidadNueva;

    productos[indice] = {
      ...productoActual,
      ...producto,

      cantidad: cantidadFinal,

      /*
       * El stock queda guardado únicamente
       * como referencia del momento
       * en que se agregó el producto.
       */
      stock_prod: stockActual,

      observacion: productoActual.observacion || producto.observacion || "",

      es_producto_catalogo: true,
    };
  } else {
    productos.push({
      ...producto,

      cantidad: cantidadNueva,

      stock_prod: stockActual,

      observacion: producto.observacion || "",

      es_producto_catalogo: true,
    });
  }

  return guardarCotizacion(productos);
}

/*
 * Actualiza la cantidad de un producto
 * dentro de la vista de cotización.
 *
 * No se limita según el stock actual.
 */
export function actualizarCantidadCotizacion(idProducto, nuevaCantidad) {
  const cantidad = validarCantidad(nuevaCantidad);

  const productos = obtenerCotizacion();

  const indice = productos.findIndex(
    (item) => Number(item.id_prod) === Number(idProducto),
  );

  if (indice < 0) {
    return productos;
  }

  productos[indice] = {
    ...productos[indice],
    cantidad,
  };

  return guardarCotizacion(productos);
}

/*
 * Elimina un producto del catálogo
 * desde la cotización temporal.
 */
export function eliminarProductoCotizacion(idProducto) {
  const productosFiltrados = obtenerCotizacion().filter(
    (producto) => Number(producto.id_prod) !== Number(idProducto),
  );

  return guardarCotizacion(productosFiltrados);
}

/*
 * Limpia completamente la cotización temporal.
 */
export function limpiarCotizacion() {
  localStorage.removeItem(COTIZACION_KEY);

  return { ...estadoInicial };
}

/*
 * Envía la cotización a Supabase.
 */
export async function enviarCotizacion({
  productosCatalogo = [],
  productosManuales = [],
  medioContacto,
  comentarioGeneral = "",
}) {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    throw new Error("Debes iniciar sesión para enviar una cotización.");
  }

  const catalogoValidos = productosCatalogo.filter(
    (producto) =>
      producto?.id_prod &&
      Number.isInteger(Number(producto.cantidad)) &&
      Number(producto.cantidad) >= 1,
  );

  const manualesValidos = productosManuales.filter(
    (producto) =>
      producto?.nom_producto_solicitado?.trim() !== "" &&
      Number.isInteger(Number(producto.cantidad)) &&
      Number(producto.cantidad) >= 1,
  );

  if (catalogoValidos.length === 0 && manualesValidos.length === 0) {
    throw new Error("Debes agregar al menos un producto.");
  }

  if (!medioContacto) {
    throw new Error("Debes seleccionar un medio de contacto.");
  }

  const { data: cabecera, error: errorCabecera } = await supabase
    .from("cotizacion")
    .insert({
      id_user: authData.user.id,

      id_medio_cont: Number(medioContacto),

      comentario: comentarioGeneral.trim() || null,

      id_estado_cot: 1,
    })
    .select("id_cotizacion")
    .single();

  if (errorCabecera) {
    throw errorCabecera;
  }

  const detallesCatalogo = catalogoValidos.map((producto) => ({
    id_cotizacion: cabecera.id_cotizacion,

    es_producto_catalogo: true,

    id_prod: producto.id_prod,

    nom_producto_solicitado: null,

    cantidad: validarCantidad(producto.cantidad),

    observacion: producto.observacion?.trim() || null,
  }));

  const detallesManuales = manualesValidos.map((producto) => ({
    id_cotizacion: cabecera.id_cotizacion,

    es_producto_catalogo: false,

    id_prod: null,

    nom_producto_solicitado: producto.nom_producto_solicitado.trim(),

    cantidad: validarCantidad(producto.cantidad),

    observacion: producto.observacion?.trim() || null,
  }));

  const detalles = [...detallesCatalogo, ...detallesManuales];

  const { error: errorDetalles } = await supabase
    .from("detalle_cotizacion")
    .insert(detalles);

  if (errorDetalles) {
    await supabase
      .from("cotizacion")
      .delete()
      .eq("id_cotizacion", cabecera.id_cotizacion);

    throw errorDetalles;
  }

  /*
    Pendiente para una etapa posterior:

    await supabase.functions.invoke(
      "notificar-cotizacion",
      {
        body: {
          idCotizacion:
            cabecera.id_cotizacion,
        },
      }
    )

    La Edge Function enviará el correo
    al administrador cuando se defina
    su dirección.
  */

  return {
    idCotizacion: cabecera.id_cotizacion,

    mensaje: "Tu cotización fue ingresada y pronto será atendida.",
  };
}
