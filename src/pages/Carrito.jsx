import useCartView from "../hooks/useCartView";
import "./css/Carrito.css";

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function Carrito() {
  const {
    productos,
    cargando,
    actualizando,
    error,
    subtotal,
    envio,
    total,
    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
  } = useCartView();

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
          <span className="cart-page__eyebrow">Tu compra</span>

          <h1>Carrito de compras</h1>

          <p>Revisa los productos agregados antes de continuar.</p>
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

      {error && <p className="cart-page__error">{error}</p>}

      {productos.length === 0 ? (
        <section className="cart-empty">
          <span className="cart-empty__icon">🛒</span>

          <h2>Tu carrito está vacío</h2>

          <p>Agrega productos desde el catálogo para comenzar tu compra.</p>
        </section>
      ) : (
        <div className="cart-layout">
          <section className="cart-products">
            {productos.map((producto) => {
              const precioActual = Number(producto.precio_act);

              const precioNormal = Number(producto.precio_prod);

              const precio =
                precioActual > 0 ? precioActual : precioNormal || 0;

              const subtotalProducto = precio * Number(producto.cantidad);

              return (
                <article key={producto.id_prod} className="cart-item">
                  <img
                    src={producto.imagen_url || "/img/producto-sin-imagen.png"}
                    alt={producto.nom_prod}
                    className="cart-item__image"
                  />

                  <div className="cart-item__information">
                    <h2>{producto.nom_prod}</h2>

                    <span className="cart-item__unit-price">
                      {formatearPrecio(precio)} c/u
                    </span>

                    <button
                      type="button"
                      className="cart-item__remove"
                      onClick={() => eliminarProducto(producto.id_prod)}
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
                        disabled={actualizando || producto.cantidad <= 1}
                      >
                        −
                      </button>

                      <strong>{producto.cantidad}</strong>

                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        onClick={() =>
                          cambiarCantidad(
                            producto.id_prod,
                            producto.cantidad + 1,
                          )
                        }
                        disabled={actualizando}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <strong className="cart-item__subtotal">
                    {formatearPrecio(subtotalProducto)}
                  </strong>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>

            <div className="cart-summary__row">
              <span>Subtotal</span>
              <strong>{formatearPrecio(subtotal)}</strong>
            </div>

            <div className="cart-summary__row">
              <span>Envío</span>
              <strong>{formatearPrecio(envio)}</strong>
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__total">
              <span>Total</span>
              <strong>{formatearPrecio(total)}</strong>
            </div>

            <button
              type="button"
              className="cart-summary__pay-button"
              disabled
              title="El pago estará disponible próximamente"
            >
              Pagar
            </button>

            <p className="cart-summary__notice">
              El pago en línea se habilitará próximamente.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Carrito;
