import { supabase } from "../lib/supabase";

const CART_STORAGE_KEY = "ferreplast_cart";
let sincronizacionEnCurso = null;

export function obtenerCarritoLocal() {
  try {
    const carritoGuardado = localStorage.getItem(CART_STORAGE_KEY);

    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } catch (error) {
    console.error("Error al leer el carrito local:", error);

    return [];
  }
}

function guardarCarritoLocal(carrito) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
}

function limpiarCarritoLocal() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

function validarCantidadConStock(
  cantidadActual,
  cantidadAgregar,
  stockDisponible,
) {
  const actual = Number(cantidadActual) || 0;

  const agregar = Number(cantidadAgregar);

  const stock = Number(stockDisponible);

  if (!Number.isInteger(agregar) || agregar < 1) {
    throw new Error("La cantidad debe ser mayor o igual a 1.");
  }

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("No fue posible comprobar el stock del producto.");
  }

  const cantidadFinal = actual + agregar;

  if (cantidadFinal > stock) {
    const stockRestante = Math.max(0, stock - actual);

    throw new Error(
      stockRestante > 0
        ? `Solo puedes agregar ${stockRestante} unidad(es) más.`
        : "Ya tienes todo el stock disponible en el carrito.",
    );
  }

  return cantidadFinal;
}

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

export function agregarProductoLocal(producto, cantidad = 1) {
  const carritoActual = obtenerCarritoLocal();

  const productoExistente = carritoActual.find(
    (item) => Number(item.id_prod) === Number(producto.id_prod),
  );

  const cantidadActual = productoExistente?.cantidad ?? 0;

  const cantidadFinal = validarCantidadConStock(
    cantidadActual,
    cantidad,
    producto.stock_prod,
  );

  let carritoActualizado;

  if (productoExistente) {
    carritoActualizado = carritoActual.map((item) =>
      Number(item.id_prod) === Number(producto.id_prod)
        ? {
            ...item,
            nom_prod: producto.nom_prod,

            precio_prod: producto.precio_prod,

            precio_act: producto.precio_act,

            imagen_url: producto.imagen_url,

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

async function obtenerProductoActual(idProducto) {
  const { data, error } = await supabase
    .from("producto")
    .select(
      `
      id_prod,
      stock_prod,
      est_prod
    `,
    )
    .eq("id_prod", idProducto)
    .single();

  if (error) {
    throw error;
  }

  if (Number(data.est_prod) !== 2) {
    throw new Error("El producto ya no se encuentra disponible.");
  }

  return data;
}

export async function agregarProductoSupabase(
  idUsuario,
  idProducto,
  cantidad = 1,
) {
  const productoActual = await obtenerProductoActual(idProducto);

  const { data: itemExistente, error: errorConsulta } = await supabase
    .from("carrito")
    .select("id_cart, cant_cart")
    .eq("id_user", idUsuario)
    .eq("id_prod", idProducto)
    .maybeSingle();

  if (errorConsulta) {
    throw errorConsulta;
  }

  const cantidadActual = itemExistente?.cant_cart ?? 0;

  const cantidadFinal = validarCantidadConStock(
    cantidadActual,
    cantidad,
    productoActual.stock_prod,
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

export async function agregarProductoAlCarrito(producto, cantidad = 1) {
  const usuario = await obtenerUsuarioActual();

  if (usuario) {
    await agregarProductoSupabase(usuario.id, producto.id_prod, cantidad);

    return {
      tipo: "supabase",
      mensaje: "Producto agregado al carrito.",
    };
  }

  agregarProductoLocal(producto, cantidad);

  return {
    tipo: "local",
    mensaje: "Producto agregado al carrito.",
  };
}

export async function sincronizarCarritoLocalConUsuario() {
  if (sincronizacionEnCurso) {
    return sincronizacionEnCurso;
  }

  const carritoLocal = obtenerCarritoLocal();

  if (!Array.isArray(carritoLocal) || carritoLocal.length === 0) {
    return null;
  }

  const carritoParaSincronizar = carritoLocal
    .map((item) => ({
      id_prod: Number(item.id_prod),

      cantidad: Number(item.cantidad),
    }))
    .filter(
      (item) =>
        Number.isInteger(item.id_prod) &&
        item.id_prod > 0 &&
        Number.isInteger(item.cantidad) &&
        item.cantidad > 0,
    );

  if (carritoParaSincronizar.length === 0) {
    limpiarCarritoLocal();
    return null;
  }

  sincronizacionEnCurso = (async () => {
    try {
      const { data, error } = await supabase.rpc(
        "sincronizar_carrito_usuario",
        {
          p_carrito: carritoParaSincronizar,
        },
      );

      if (error) {
        throw error;
      }

      limpiarCarritoLocal();

      return data;
    } finally {
      sincronizacionEnCurso = null;
    }
  })();

  return sincronizacionEnCurso;
}

async function obtenerCarritoSupabase(idUsuario) {
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
        stock_prod,
        est_prod
      )
    `,
    )
    .eq("id_user", idUsuario)
    .order("creado_cart", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((item) => item.producto && Number(item.producto.est_prod) === 2)
    .map((item) => ({
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

export async function obtenerProductosCarrito() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return obtenerCarritoLocal();
  }

  await sincronizarCarritoLocalConUsuario();

  return obtenerCarritoSupabase(usuario.id);
}

export async function actualizarCantidadCarrito(idProducto, nuevaCantidad) {
  const cantidad = Number(nuevaCantidad);

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new Error("La cantidad debe ser mayor o igual a 1.");
  }

  const usuario = await obtenerUsuarioActual();

  /*
   * Carrito local.
   */
  if (!usuario) {
    const carritoActual = obtenerCarritoLocal();

    const productoExistente = carritoActual.find(
      (item) => Number(item.id_prod) === Number(idProducto),
    );

    if (!productoExistente) {
      throw new Error("No se encontró el producto en el carrito.");
    }

    const stock = Number(productoExistente.stock_prod);

    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error("No fue posible comprobar el stock del producto.");
    }

    if (cantidad > stock) {
      throw new Error(`Solo hay ${stock} unidad(es) disponibles.`);
    }

    const carritoActualizado = carritoActual.map((item) =>
      Number(item.id_prod) === Number(idProducto)
        ? {
            ...item,
            cantidad,
          }
        : item,
    );

    guardarCarritoLocal(carritoActualizado);

    return carritoActualizado;
  }

  const productoActual = await obtenerProductoActual(idProducto);

  const stock = Number(productoActual.stock_prod);

  if (cantidad > stock) {
    throw new Error(`Solo hay ${stock} unidad(es) disponibles.`);
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

  return obtenerCarritoSupabase(usuario.id);
}

export async function eliminarProductoCarrito(idProducto) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    const carritoActual = obtenerCarritoLocal();

    const carritoActualizado = carritoActual.filter(
      (item) => Number(item.id_prod) !== Number(idProducto),
    );

    guardarCarritoLocal(carritoActualizado);

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

  return obtenerCarritoSupabase(usuario.id);
}

export async function vaciarCarrito() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    limpiarCarritoLocal();

    return [];
  }

  const { error } = await supabase
    .from("carrito")
    .delete()
    .eq("id_user", usuario.id);

  if (error) {
    throw error;
  }

  limpiarCarritoLocal();

  return [];
}
