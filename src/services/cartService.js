import { supabase } from "../lib/supabase";

const CART_STORAGE_KEY = "ferreplast_cart";

/*
 * Obtiene el carrito guardado para usuarios invitados.
 */
export function obtenerCarritoLocal() {
  try {
    const carritoGuardado = localStorage.getItem(
      CART_STORAGE_KEY,
    );

    return carritoGuardado
      ? JSON.parse(carritoGuardado)
      : [];
  } catch (error) {
    console.error(
      "Error al leer el carrito local:",
      error,
    );

    return [];
  }
}

/*
 * Guarda el carrito completo en localStorage.
 */
function guardarCarritoLocal(carrito) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(carrito),
  );
}

/*
 * Valida que la cantidad final del producto
 * no supere el stock disponible.
 */
function validarCantidadConStock(
  cantidadActual,
  cantidadAgregar,
  stockDisponible,
) {
  const actual = Number(cantidadActual) || 0;
  const agregar = Number(cantidadAgregar);
  const stock = Number(stockDisponible);

  if (
    !Number.isInteger(agregar) ||
    agregar < 1
  ) {
    throw new Error(
      "La cantidad debe ser mayor o igual a 1.",
    );
  }

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    throw new Error(
      "No fue posible comprobar el stock del producto.",
    );
  }

  const cantidadFinal = actual + agregar;

  if (cantidadFinal > stock) {
    const stockRestante = Math.max(
      0,
      stock - actual,
    );

    throw new Error(
      stockRestante > 0
        ? `Solo puedes agregar ${stockRestante} unidad(es) más.`
        : "Ya tienes todo el stock disponible en el carrito.",
    );
  }

  return cantidadFinal;
}

/*
 * Agrega un producto al carrito de un usuario invitado.
 * Si ya existe, aumenta su cantidad sin superar el stock.
 */
export function agregarProductoLocal(
  producto,
  cantidad = 1,
) {
  const carritoActual = obtenerCarritoLocal();

  const productoExistente = carritoActual.find(
    (item) =>
      item.id_prod === producto.id_prod,
  );

  const cantidadActual =
    productoExistente?.cantidad ?? 0;

  const cantidadFinal =
    validarCantidadConStock(
      cantidadActual,
      cantidad,
      producto.stock_prod,
    );

  let carritoActualizado;

  if (productoExistente) {
    carritoActualizado = carritoActual.map(
      (item) =>
        item.id_prod === producto.id_prod
          ? {
              ...item,
              stock_prod: producto.stock_prod,
              cantidad: cantidadFinal,
            }
          : item,
    );
  } else {
    carritoActualizado = [
      ...carritoActual,
      {
        id_prod: producto.id_prod,
        nom_prod: producto.nom_prod,
        precio_prod: producto.precio_prod,
        precio_act: producto.precio_act,
        imagen_url: producto.imagen_url,
        stock_prod: producto.stock_prod,
        cantidad: cantidadFinal,
      },
    ];
  }

  guardarCarritoLocal(carritoActualizado);

  return carritoActualizado;
}

/*
 * Obtiene la sesión actual.
 */
export async function obtenerUsuarioActual() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return session?.user ?? null;
}

/*
 * Agrega un producto al carrito
 * de un usuario autenticado.
 *
 * Si ya existe, aumenta cant_cart.
 * Si no existe, crea una nueva fila.
 *
 * La cantidad final no puede superar
 * el stock disponible del producto.
 */
export async function agregarProductoSupabase(
  idUsuario,
  idProducto,
  cantidad = 1,
  stockDisponible,
) {
  const {
    data: itemExistente,
    error: errorConsulta,
  } = await supabase
    .from("carrito")
    .select("id_cart, cant_cart")
    .eq("id_user", idUsuario)
    .eq("id_prod", idProducto)
    .maybeSingle();

  if (errorConsulta) {
    throw errorConsulta;
  }

  const cantidadActual =
    itemExistente?.cant_cart ?? 0;

  const cantidadFinal =
    validarCantidadConStock(
      cantidadActual,
      cantidad,
      stockDisponible,
    );

  if (itemExistente) {
    const { data, error } = await supabase
      .from("carrito")
      .update({
        cant_cart: cantidadFinal,
      })
      .eq("id_cart", itemExistente.id_cart)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("carrito")
    .insert({
      id_user: idUsuario,
      id_prod: idProducto,
      cant_cart: cantidadFinal,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/*
 * Decide automáticamente dónde guardar
 * el producto según exista o no una sesión.
 */
export async function agregarProductoAlCarrito(
  producto,
  cantidad = 1,
) {
  const usuario = await obtenerUsuarioActual();

  if (usuario) {
    await agregarProductoSupabase(
      usuario.id,
      producto.id_prod,
      cantidad,
      producto.stock_prod,
    );

    return {
      tipo: "supabase",
      mensaje:
        "Producto agregado al carrito.",
    };
  }

  agregarProductoLocal(
    producto,
    cantidad,
  );

  return {
    tipo: "local",
    mensaje:
      "Producto agregado al carrito.",
  };
}

/*
 * Obtiene los productos del carrito.
 */
export async function obtenerProductosCarrito() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return obtenerCarritoLocal();
  }

  const { data, error } = await supabase
    .from("carrito")
    .select(
      `
      id_cart,
      cant_cart,
      producto (
        id_prod,
        nom_prod,
        precio_prod,
        precio_act,
        imagen_url,
        stock_prod
      )
    `,
    )
    .eq("id_user", usuario.id)
    .order("creado_cart", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id_cart: item.id_cart,
    id_prod: item.producto.id_prod,
    nom_prod: item.producto.nom_prod,
    precio_prod: item.producto.precio_prod,
    precio_act: item.producto.precio_act,
    imagen_url: item.producto.imagen_url,
    stock_prod: item.producto.stock_prod,
    cantidad: item.cant_cart,
  }));
}

/*
 * Actualiza la cantidad de un producto
 * dentro del carrito.
 */
export async function actualizarCantidadCarrito(
  idProducto,
  nuevaCantidad,
) {
  const cantidad = Number(nuevaCantidad);

  if (
    !Number.isInteger(cantidad) ||
    cantidad < 1
  ) {
    throw new Error(
      "La cantidad debe ser mayor o igual a 1.",
    );
  }

  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    const carritoActual =
      obtenerCarritoLocal();

    const productoExistente =
      carritoActual.find(
        (item) =>
          item.id_prod === idProducto,
      );

    if (!productoExistente) {
      throw new Error(
        "No se encontró el producto en el carrito.",
      );
    }

    const stock = Number(
      productoExistente.stock_prod,
    );

    if (
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      throw new Error(
        "No fue posible comprobar el stock del producto.",
      );
    }

    if (cantidad > stock) {
      throw new Error(
        `Solo hay ${stock} unidad(es) disponibles.`,
      );
    }

    const carritoActualizado =
      carritoActual.map((item) =>
        item.id_prod === idProducto
          ? {
              ...item,
              cantidad,
            }
          : item,
      );

    guardarCarritoLocal(
      carritoActualizado,
    );

    return carritoActualizado;
  }

  const {
    data: producto,
    error: errorProducto,
  } = await supabase
    .from("producto")
    .select("stock_prod")
    .eq("id_prod", idProducto)
    .single();

  if (errorProducto) {
    throw errorProducto;
  }

  const stock = Number(
    producto.stock_prod,
  );

  if (
    !Number.isFinite(stock) ||
    stock < 0
  ) {
    throw new Error(
      "No fue posible comprobar el stock del producto.",
    );
  }

  if (cantidad > stock) {
    throw new Error(
      `Solo hay ${stock} unidad(es) disponibles.`,
    );
  }

  const { error } = await supabase
    .from("carrito")
    .update({
      cant_cart: cantidad,
    })
    .eq("id_user", usuario.id)
    .eq("id_prod", idProducto);

  if (error) {
    throw error;
  }

  return obtenerProductosCarrito();
}

/*
 * Elimina un producto del carrito.
 */
export async function eliminarProductoCarrito(
  idProducto,
) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    const carritoActual =
      obtenerCarritoLocal();

    const carritoActualizado =
      carritoActual.filter(
        (item) =>
          item.id_prod !== idProducto,
      );

    guardarCarritoLocal(
      carritoActualizado,
    );

    return carritoActualizado;
  }

  const { error } = await supabase
    .from("carrito")
    .delete()
    .eq("id_user", usuario.id)
    .eq("id_prod", idProducto);

  if (error) {
    throw error;
  }

  return obtenerProductosCarrito();
}

/*
 * Vacía completamente el carrito.
 */
export async function vaciarCarrito() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    localStorage.removeItem(
      CART_STORAGE_KEY,
    );

    return [];
  }

  const { error } = await supabase
    .from("carrito")
    .delete()
    .eq("id_user", usuario.id);

  if (error) {
    throw error;
  }

  return [];
}