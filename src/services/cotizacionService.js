import { supabase } from "../lib/supabase";

const COTIZACION_KEY = "cotizacion_temporal";

const estadoInicial = {
  productosCatalogo: [],
  productosManuales: [],
  medioContacto: "",
  comentarioGeneral: "",
};

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

export function guardarCotizacionCompleta(cotizacion) {
  const normalizada = normalizarCotizacion(cotizacion);

  localStorage.setItem(COTIZACION_KEY, JSON.stringify(normalizada));

  return normalizada;
}

export function obtenerCotizacion() {
  return obtenerCotizacionCompleta().productosCatalogo;
}

export function guardarCotizacion(productos) {
  const cotizacion = obtenerCotizacionCompleta();

  cotizacion.productosCatalogo = Array.isArray(productos) ? productos : [];

  guardarCotizacionCompleta(cotizacion);

  return cotizacion.productosCatalogo;
}

export function agregarProductoCotizacion(producto) {
  if (!producto?.id_prod) {
    throw new Error("El producto no es válido.");
  }

  const stock = Math.max(0, Number(producto.stock_prod) || 0);

  if (stock <= 0) {
    throw new Error("El producto no tiene stock disponible.");
  }

  const productos = obtenerCotizacion();

  const indice = productos.findIndex(
    (item) => Number(item.id_prod) === Number(producto.id_prod),
  );

  const cantidadNueva = Math.max(1, Math.trunc(Number(producto.cantidad) || 1));

  if (indice >= 0) {
    const productoActual = productos[indice];

    productos[indice] = {
      ...productoActual,
      ...producto,
      stock_prod: stock,

      cantidad: Math.min(
        (Number(productoActual.cantidad) || 0) + cantidadNueva,
        stock,
      ),
    };
  } else {
    productos.push({
      ...producto,
      stock_prod: stock,

      cantidad: Math.min(cantidadNueva, stock),

      observacion: producto.observacion || "",

      es_producto_catalogo: true,
    });
  }

  return guardarCotizacion(productos);
}

export function actualizarCantidadCotizacion(idProducto, nuevaCantidad) {
  const productos = obtenerCotizacion();

  const indice = productos.findIndex(
    (item) => Number(item.id_prod) === Number(idProducto),
  );

  if (indice < 0) {
    return productos;
  }

  const stock = Math.max(1, Number(productos[indice].stock_prod) || 1);

  const cantidad = Math.min(
    stock,
    Math.max(1, Math.trunc(Number(nuevaCantidad) || 1)),
  );

  productos[indice] = {
    ...productos[indice],
    cantidad,
  };

  return guardarCotizacion(productos);
}

export function eliminarProductoCotizacion(idProducto) {
  const productosFiltrados = obtenerCotizacion().filter(
    (producto) => Number(producto.id_prod) !== Number(idProducto),
  );

  return guardarCotizacion(productosFiltrados);
}

export function limpiarCotizacion() {
  localStorage.removeItem(COTIZACION_KEY);

  return { ...estadoInicial };
}

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
    (producto) => producto?.id_prod && Number(producto.cantidad) >= 1,
  );

  const manualesValidos = productosManuales.filter(
    (producto) =>
      producto?.nom_producto_solicitado?.trim() !== "" &&
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

    cantidad: Math.max(1, Math.trunc(Number(producto.cantidad) || 1)),

    observacion: producto.observacion?.trim() || null,
  }));

  const detallesManuales = manualesValidos.map((producto) => ({
    id_cotizacion: cabecera.id_cotizacion,

    es_producto_catalogo: false,

    id_prod: null,

    nom_producto_solicitado: producto.nom_producto_solicitado.trim(),

    cantidad: Math.max(1, Math.trunc(Number(producto.cantidad) || 1)),

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
