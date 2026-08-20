import { useNavigate } from "react-router-dom";
import useCartView from "../../hooks/useCartView";
import { supabase } from "../../lib/supabase";
import "../css/Carrito.css";
import { useState } from "react";

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function obtenerUrlImagen(rutaImagen) {
  if (!rutaImagen) {
    return "https://placehold.co/400x400/f1f5f9/9ca3af?text=Sin+imagen";
  }

  if (
    rutaImagen.startsWith("http://") ||
    rutaImagen.startsWith("https://")
  ) {
    return rutaImagen;
  }

  const { data } = supabase.storage
    .from("imagenes_productos")
    .getPublicUrl(rutaImagen);

  return data.publicUrl;
}

function Carrito() {
  const navigate = useNavigate();
  const [iniciandoPago, setIniciandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");

  const {
    productos,
    cargando,
    actualizando,
    error,

    usuario,
    tipoDespacho,

    subtotal,
    envio,
    total,

    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
  } = useCartView();

  /*
   * El botón Pagar todavía no realiza el pago.
   *
   * Por ahora:
   *
   * - Sin sesión:
   *      redirige al login.
   *
   * - Con sesión:
   *      permite continuar al futuro flujo
   *      de validación de stock / despacho / pago.
   */
  async function continuarCompra() {
  if (!usuario) {
    navigate("/login", {
      state: {
        from: "/carrito",
      },
    });

    return;
  }

  if (!Number.isInteger(Math.round(total)) || total <= 0) {
    setErrorPago("El total de la compra no es válido.");
    return;
  }

  setIniciandoPago(true);
  setErrorPago("");

  try {
    const respuesta = await fetch(
      "http://localhost:3000/api/webpay/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(total),
          sessionId: usuario.id,
        }),
      },
    );

    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        data.error || "No fue posible iniciar el pago.",
      );
    }

    const formulario = document.createElement("form");
    formulario.method = "POST";
    formulario.action = data.url;

    const token = document.createElement("input");
    token.type = "hidden";
    token.name = "token_ws";
    token.value = data.token;

    formulario.appendChild(token);
    document.body.appendChild(formulario);
    formulario.submit();
  } catch (error) {
    console.error("Error iniciando Webpay:", error);
    setErrorPago(
      error.message || "No fue posible conectar con Webpay.",
    );
    setIniciandoPago(false);
  }
}



  /*
   * Texto mostrado en la fila de envío.
   */
  function obtenerTextoEnvio() {
    /*
     * Sin sesión todavía no sabemos
     * cuál es la comuna del cliente.
     */
    if (!usuario) {
      return "Se calculará al continuar";
    }

    /*
     * FALSE = despacho directo Ferreplast.
     *
     * Actualmente corresponde a:
     * Puerto Montt (id_comuna = 313).
     */
    if (tipoDespacho === false) {
      return formatearPrecio(envio);
    }

    /*
     * TRUE = despacho mediante transportista.
     *
     * El costo no se suma al carrito porque será
     * gestionado posteriormente según el destino.
     */
    if (tipoDespacho === true) {
      return "A cargo de transportista";
    }

    /*
     * Caso excepcional:
     * usuario autenticado pero sin información
     * suficiente para determinar despacho.
     */
    return "Por determinar";
  }

  /*
   * Información complementaria del despacho.
   */
  function obtenerMensajeDespacho() {
    if (!usuario) {
      return "Inicia sesión para determinar la modalidad de despacho.";
    }

    if (tipoDespacho === false) {
      return "Entrega directa Ferreplast en Puerto Montt.";
    }

    if (tipoDespacho === true) {
      return "El despacho será realizado por un transportista externo. El costo de transporte no está incluido en este total.";
    }

    return "No fue posible determinar la modalidad de despacho.";
  }

  if (cargando) {
    return (
      <main className="cart-page">
        <p>Cargando carrito...</p>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <div>
          <span className="cart-page__eyebrow">
            Tu compra
          </span>

          <h1>Carrito de compras</h1>

          <p>
            Revisa los productos agregados antes de continuar.
          </p>
        </div>

        {productos.length > 0 && (
          <button
            type="button"
            className="cart-page__clear-button"
            onClick={vaciarCarritoCompleto}
            disabled={actualizando}
          >
            Vaciar carrito
          </button>
        )}
      </header>

      {errorPago && (
        <p className="cart-page__error">
         {errorPago}
        </p>
         )}

      {productos.length === 0 ? (
        <section className="cart-empty">
          <span className="cart-empty__icon">
            🛒
          </span>

          <h2>Tu carrito está vacío</h2>

          <p>
            Agrega productos desde el catálogo para comenzar tu compra.
          </p>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-products">
            {productos.map((producto) => {
              const precioActual = Number(
                producto.precio_act,
              );

              const precioNormal = Number(
                producto.precio_prod,
              );

              const precio =
                precioActual > 0
                  ? precioActual
                  : precioNormal || 0;

              const subtotalProducto =
                precio *
                Number(producto.cantidad);

              return (
                <article
                  key={producto.id_prod}
                  className="cart-item"
                >
                  <img
                    src={obtenerUrlImagen(
                      producto.imagen_url,
                    )}
                    alt={producto.nom_prod}
                    className="cart-item__image"
                    onError={(event) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "https://placehold.co/400x400/f1f5f9/9ca3af?text=Sin+imagen";
                    }}
                  />

                  <div className="cart-item__information">
                    <h2>
                      {producto.nom_prod}
                    </h2>

                    <span className="cart-item__unit-price">
                      {formatearPrecio(precio)}{" "}
                      c/u
                    </span>

                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() =>
                        eliminarProducto(
                          producto.id_prod,
                        )
                      }
                      disabled={actualizando}
                    >
                      Quitar producto
                    </button>
                  </div>

                  <div className="cart-item__quantity">
                    <span>Cantidad</span>

                    <div className="quantity-control">
                      <button
                        type="button"
                        aria-label="Disminuir cantidad"
                        onClick={() =>
                          cambiarCantidad(
                            producto.id_prod,
                            producto.cantidad - 1,
                          )
                        }
                        disabled={
                          actualizando ||
                          producto.cantidad <= 1
                        }
                      >
                        −
                      </button>

                      <strong>
                        {producto.cantidad}
                      </strong>

                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        onClick={() =>
                          cambiarCantidad(
                            producto.id_prod,
                            producto.cantidad + 1,
                          )
                        }
                        disabled={
                          actualizando ||
                          producto.cantidad >=
                            producto.stock_prod
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <strong className="cart-item__subtotal">
                    {formatearPrecio(
                      subtotalProducto,
                    )}
                  </strong>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>

            <div className="cart-summary__row">
              <span>Subtotal</span>

              <strong>
                {formatearPrecio(subtotal)}
              </strong>
            </div>

            <div className="cart-summary__row">
              <span>Envío</span>

              <strong>
                {obtenerTextoEnvio()}
              </strong>
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__total">
              <span>Total</span>

              <strong>
                {formatearPrecio(total)}
              </strong>
            </div>

            <button
            type="button"
            className="cart-summary__pay-button"
            onClick={continuarCompra}
            disabled={
              productos.length === 0 ||
              cargando ||
              actualizando ||
              iniciandoPago
            }
            >
              {iniciandoPago ? "Redirigiendo a Webpay..." : "Pagar con Webpay"}
            </button>

            <p className="cart-summary__notice">
              {obtenerMensajeDespacho()}
            </p>
          </aside>
        </div>
      )}
    </main>
  );

 }
export default Carrito;