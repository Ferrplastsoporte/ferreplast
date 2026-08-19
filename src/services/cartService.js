import { supabase } from "../lib/supabase";

const CART_STORAGE_KEY = "ferreplast_cart";

/*
 * Obtiene el carrito guardado para usuarios invitados.
 */
export function obtenerCarritoLocal() {
  try {
    const carritoGuardado = localStorage.getItem(CART_STORAGE_KEY);

    return carritoGuardado ? JSON.parse(carritoGuardado) : [];
  } catch (error) {
    console.error("Error al leer el carrito local:", error);

    return [];
  }
}

/*
 * Guarda el carrito completo en localStorage.
 */
function guardarCarritoLocal(carrito) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(carrito));
}

/*
 * Elimina solamente el carrito local.
 */
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

export async function agregarProductoSupabase(
  idUsuario,
  idProducto,
  cantidad = 1,
  stockDisponible,
) {
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

export async function agregarProductoAlCarrito(producto, cantidad = 1) {
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
      mensaje: "Producto agregado al carrito.",
    };
  }

  agregarProductoLocal(producto, cantidad);

  return {
    tipo: "local",
    mensaje: "Producto agregado al carrito.",
  };
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

  /*
   * Como medida adicional de seguridad,
   * solamente devolvemos productos activos.
   *
   * El trigger de limpieza debería retirar
   * productos no disponibles, pero esta
   * validación evita mostrarlos igualmente.
   */
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

/*
 * ==========================================================
 * MIGRACIÓN DEL CARRITO LOCAL
 * ==========================================================
 *
 * Se ejecuta cuando:
 *
 * - existe una sesión;
 * - existen productos en localStorage.
 *
 * Nunca copia directamente los datos guardados
 * localmente.
 *
 * Primero vuelve a consultar producto para validar:
 *
 * - que exista;
 * - que est_prod = 2;
 * - que tenga stock disponible;
 * - que la cantidad no supere el stock actual.
 *
 * También considera productos que ya estaban
 * en el carrito de la cuenta.
 */

export async function sincronizarCarritoLocalConUsuario(idUsuario) {
  const carritoLocal = obtenerCarritoLocal();

  if (!Array.isArray(carritoLocal) || carritoLocal.length === 0) {
    return {
      sincronizado: false,
      ajustados: 0,
      omitidos: 0,
    };
  }

  const idsProductos = [
    ...new Set(
      carritoLocal
        .map((item) => Number(item.id_prod))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (idsProductos.length === 0) {
    limpiarCarritoLocal();

    return {
      sincronizado: false,
      ajustados: 0,
      omitidos: carritoLocal.length,
    };
  }

  const { data: productosActuales, error: errorProductos } = await supabase
    .from("producto")
    .select(
      `
      id_prod,
      stock_prod,
      est_prod
      `,
    )
    .in("id_prod", idsProductos);

  if (errorProductos) {
    throw errorProductos;
  }

  const mapaProductos = new Map(
    (productosActuales ?? []).map((producto) => [
      Number(producto.id_prod),
      producto,
    ]),
  );

  const { data: carritoUsuario, error: errorCarrito } = await supabase
    .from("carrito")
    .select(
      `
      id_cart,
      id_prod,
      cant_cart
      `,
    )
    .eq("id_user", idUsuario);

  if (errorCarrito) {
    throw errorCarrito;
  }

  const mapaCarritoUsuario = new Map(
    (carritoUsuario ?? []).map((item) => [Number(item.id_prod), item]),
  );

  let ajustados = 0;
  let omitidos = 0;

  for (const itemLocal of carritoLocal) {
    const idProducto = Number(itemLocal.id_prod);

    const productoActual = mapaProductos.get(idProducto);

    if (!productoActual) {
      omitidos += 1;
      continue;
    }

    if (Number(productoActual.est_prod) !== 2) {
      omitidos += 1;
      continue;
    }

    const stockActual = Number(productoActual.stock_prod);

    if (!Number.isFinite(stockActual) || stockActual <= 0) {
      omitidos += 1;
      continue;
    }

    let cantidadLocal = Number(itemLocal.cantidad);

    if (!Number.isInteger(cantidadLocal) || cantidadLocal < 1) {
      omitidos += 1;
      continue;
    }

    const itemCuenta = mapaCarritoUsuario.get(idProducto);

    const cantidadCuenta = Number(itemCuenta?.cant_cart) || 0;

    let cantidadFinal = cantidadCuenta + cantidadLocal;

    if (cantidadFinal > stockActual) {
      cantidadFinal = stockActual;

      ajustados += 1;
    }

    if (cantidadCuenta >= stockActual) {
      ajustados += 1;
      continue;
    }

    if (itemCuenta) {
      const { error: errorActualizacion } = await supabase
        .from("carrito")
        .update({
          cant_cart: cantidadFinal,
        })
        .eq("id_cart", itemCuenta.id_cart);

      if (errorActualizacion) {
        throw errorActualizacion;
      }

      mapaCarritoUsuario.set(idProducto, {
        ...itemCuenta,
        cant_cart: cantidadFinal,
      });

      continue;
    }

    const { data: nuevoItem, error: errorInsercion } = await supabase
      .from("carrito")
      .insert({
        id_user: idUsuario,

        id_prod: idProducto,

        cant_cart: Math.min(cantidadLocal, stockActual),
      })
      .select(
        `
        id_cart,
        id_prod,
        cant_cart
        `,
      )
      .single();

    if (errorInsercion) {
      throw errorInsercion;
    }

    mapaCarritoUsuario.set(idProducto, nuevoItem);

    if (cantidadLocal > stockActual) {
      ajustados += 1;
    }
  }

  /*
   * MUY IMPORTANTE:
   *
   * localStorage se elimina solamente cuando
   * todo el proceso terminó sin lanzar errores.
   *
   * Si Supabase falla a mitad de la migración,
   * el carrito local se conserva para poder
   * volver a intentarlo.
   */
  limpiarCarritoLocal();

  return {
    sincronizado: true,
    ajustados,
    omitidos,
  };
}

export async function obtenerProductosCarrito() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    return obtenerCarritoLocal();
  }

  await sincronizarCarritoLocalConUsuario(usuario.id);

  return obtenerCarritoSupabase(usuario.id);
}

export async function actualizarCantidadCarrito(idProducto, nuevaCantidad) {
  const cantidad = Number(nuevaCantidad);

  if (!Number.isInteger(cantidad) || cantidad < 1) {
    throw new Error("La cantidad debe ser mayor o igual a 1.");
  }

  const usuario = await obtenerUsuarioActual();

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

  const { data: producto, error: errorProducto } = await supabase
    .from("producto")
    .select(
      `
      stock_prod,
      est_prod
      `,
    )
    .eq("id_prod", idProducto)
    .single();

  if (errorProducto) {
    throw errorProducto;
  }

  if (Number(producto.est_prod) !== 2) {
    throw new Error("El producto ya no se encuentra disponible.");
  }

  const stock = Number(producto.stock_prod);

  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("No fue posible comprobar el stock del producto.");
  }

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
