import { supabase } from "../lib/supabase"

const CART_STORAGE_KEY = "ferreplast_cart"

/*
 * Obtiene el carrito guardado para usuarios invitados.
 */
export function obtenerCarritoLocal() {
  try {
    const carritoGuardado = localStorage.getItem(
      CART_STORAGE_KEY
    )

    return carritoGuardado
      ? JSON.parse(carritoGuardado)
      : []
  } catch (error) {
    console.error(
      "Error al leer el carrito local:",
      error
    )

    return []
  }
}

/*
 * Guarda el carrito completo en localStorage.
 */
function guardarCarritoLocal(carrito) {
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify(carrito)
  )
}

/*
 * Agrega un producto al carrito de un usuario invitado.
 * Si ya existe, aumenta su cantidad.
 */
export function agregarProductoLocal(
  producto,
  cantidad = 1
) {
  const carritoActual = obtenerCarritoLocal()

  const productoExistente = carritoActual.find(
    (item) => item.id_prod === producto.id_prod
  )

  let carritoActualizado

  if (productoExistente) {
    carritoActualizado = carritoActual.map((item) =>
      item.id_prod === producto.id_prod
        ? {
            ...item,
            cantidad: item.cantidad + cantidad,
          }
        : item
    )
  } else {
    carritoActualizado = [
      ...carritoActual,
      {
        id_prod: producto.id_prod,
        nom_prod: producto.nom_prod,
        precio_prod: producto.precio_prod,
        precio_act: producto.precio_act,
        imagen_url: producto.imagen_url,
        cantidad,
      },
    ]
  }

  guardarCarritoLocal(carritoActualizado)

  return carritoActualizado
}

/*
 * Obtiene la sesión actual.
 */
export async function obtenerUsuarioActual() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return session?.user ?? null
}

/*
 * Agrega un producto al carrito de un usuario autenticado.
 *
 * Si ya existe, aumenta cant_cart.
 * Si no existe, crea una nueva fila.
 */
export async function agregarProductoSupabase(
  idUsuario,
  idProducto,
  cantidad = 1
) {
  const { data: itemExistente, error: errorConsulta } =
    await supabase
      .from("carrito")
      .select("id_cart, cant_cart")
      .eq("id_user", idUsuario)
      .eq("id_prod", idProducto)
      .maybeSingle()

  if (errorConsulta) {
    throw errorConsulta
  }

  if (itemExistente) {
    const nuevaCantidad =
      Number(itemExistente.cant_cart) + cantidad

    const { data, error } = await supabase
      .from("carrito")
      .update({
        cant_cart: nuevaCantidad,
      })
      .eq("id_cart", itemExistente.id_cart)
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const { data, error } = await supabase
    .from("carrito")
    .insert({
      id_user: idUsuario,
      id_prod: idProducto,
      cant_cart: cantidad,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/*
 * Decide automáticamente dónde guardar el producto.
 */
export async function agregarProductoAlCarrito(
  producto,
  cantidad = 1
) {
  const usuario = await obtenerUsuarioActual()

  if (usuario) {
    await agregarProductoSupabase(
      usuario.id,
      producto.id_prod,
      cantidad
    )

    return {
      tipo: "supabase",
      mensaje: "Producto agregado al carrito.",
    }
  }

  agregarProductoLocal(producto, cantidad)

  return {
    tipo: "local",
    mensaje: "Producto agregado al carrito.",
  }
}