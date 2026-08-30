import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCartView from "../../hooks/useCartView";
import useCheckoutFactura from "../../hooks/useCheckoutFactura";
import { supabase } from "../../lib/supabase";
import "./css/Carrito.css";

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
  if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
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
  const [regiones, setRegiones] = useState([]);
  const [comunas, setComunas] = useState([]);
  const [idRegionFactura, setIdRegionFactura] = useState("");
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);

  const {
    esFactura,
    datosFactura,
    seleccionarTipoDocumento,
    actualizarDatoFactura,
    validarFactura,
    obtenerDatosFacturacion,
  } = useCheckoutFactura();

  const {
    productos,
    cargando,
    actualizando,
    error,
    usuario,
    idComuna,
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
  } = useCartView();

  useEffect(() => {
    cargarUbicaciones();
  }, []);

  async function cargarUbicaciones() {
    setCargandoUbicaciones(true);

    try {
      const [resultadoRegiones, resultadoComunas] = await Promise.all([
        supabase
          .from("region")
          .select(
            `
              id_reg,
              nom_reg
              `,
          )
          .order("nom_reg", {
            ascending: true,
          }),

        supabase
          .from("comuna")
          .select(
            `
              id_comuna,
              nom_comuna,
              id_reg
              `,
          )
          .order("nom_comuna", {
            ascending: true,
          }),
      ]);

      const errorUbicaciones =
        resultadoRegiones.error || resultadoComunas.error;
      if (errorUbicaciones) {
        throw errorUbicaciones;
      }
      setRegiones(resultadoRegiones.data ?? []);
      setComunas(resultadoComunas.data ?? []);
    } catch (errorCarga) {
      console.error("Error al cargar regiones y comunas:", errorCarga);
      setErrorPago("No fue posible cargar las regiones y comunas.");
    } finally {
      setCargandoUbicaciones(false);
    }
  }

  const comunasFiltradas = idRegionFactura
    ? comunas.filter(
        (comuna) => Number(comuna.id_reg) === Number(idRegionFactura),
      )
    : [];

  function cambiarRegionFactura(valor) {
    setIdRegionFactura(valor);
    actualizarDatoFactura("id_comuna", "");
    setErrorPago("");
  }

  function cambiarTipoDocumento(tipo) {
    seleccionarTipoDocumento(tipo);
    setErrorPago("");
    if (tipo === "boleta") {
      setIdRegionFactura("");
    }
  }

  function cambiarTipoDespacho(idTipoDespacho) {
    seleccionarTipoDespacho(idTipoDespacho);
    setErrorPago("");
  }

  async function continuarCompra() {
    if (!usuario) {
      navigate("/login", {
        state: {
          from: "/carrito",
        },
      });
      return;
    }
    setErrorPago("");

    if (!despachoListo || !despachoSeleccionado) {
      setErrorPago("Selecciona una modalidad de entrega antes de continuar.");
      return;
    }

    const validacionFactura = validarFactura();

    if (!validacionFactura.valido) {
      setErrorPago(validacionFactura.mensaje);
      return;
    }

    if (esFactura && !idRegionFactura) {
      setErrorPago("Selecciona la región de facturación.");
      return;
    }

    if (!Number.isInteger(Math.round(total)) || total <= 0) {
      setErrorPago("El total de la compra no es válido.");
      return;
    }

    const facturacion = obtenerDatosFacturacion();
    sessionStorage.setItem(
      "ferreplast_checkout_facturacion",
      JSON.stringify(facturacion),
    );

    const datosDespacho = {
      id_tipo_despacho: Number(despachoSeleccionado.id_tipo_despacho),
      nom_tipo_despacho: despachoSeleccionado.nom_tipo_despacho,
      costo_envio: Number(envio),
      requiere_coordinacion: requiereCoordinacion,
      id_comuna: Number(idComuna),
    };

    sessionStorage.setItem(
      "ferreplast_checkout_despacho",
      JSON.stringify(datosDespacho),
    );

    console.log("Facturación preparada:", facturacion);
    console.log("Despacho preparado:", datosDespacho);

    setIniciandoPago(true);

    try {
      const respuesta = await fetch("http://localhost:3000/api/webpay/create", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          amount: Math.round(total),
          sessionId: usuario.id,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "No fue posible iniciar el pago.");
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
    } catch (errorInicio) {
      console.error("Error iniciando Webpay:", errorInicio);

      setErrorPago(
        errorInicio.message || "No fue posible conectar con Webpay.",
      );

      setIniciandoPago(false);
    }
  }

  /* =======================================================
     TEXTO COSTO DESPACHO
  ======================================================= */
  function obtenerTextoEnvio() {
    if (!usuario) {
      return "Por calcular";
    }
    if (!despachoSeleccionado) {
      return "Selecciona una opción";
    }
    if (requiereCoordinacion) {
      return "Por coordinar";
    }
    if (Number(envio) === 0) {
      return "Gratis";
    }
    return formatearPrecio(envio);
  }

  /* =======================================================
     MENSAJE DESPACHO
  ======================================================= */
  function obtenerMensajeDespacho() {
    if (!usuario) {
      return "Inicia sesión para conocer tus opciones y costos de despacho.";
    }
    if (!despachoSeleccionado) {
      return "Selecciona una modalidad de entrega para continuar con la compra.";
    }
    if (requiereCoordinacion) {
      return "El costo de envío a otras ciudades no está incluido en este pago. Una vez realizada la compra, Ferreplast se pondrá en contacto contigo para coordinar el transporte y su costo.";
    }
    if (Number(despachoSeleccionado.id_tipo_despacho) === 1) {
      return "Tu pedido quedará disponible para retiro en tienda.";
    }
    return "El costo de despacho seleccionado está incluido en el total de la compra.";
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

      {(error || errorPago) && (
        <p className="cart-page__error">{errorPago || error}</p>
      )}

      {productos.length === 0 ? (
        <section className="cart-empty">
          <span className="cart-empty__icon">🛒</span>

          <h2>Tu carrito está vacío</h2>

          <p>Agrega productos desde el catálogo para comenzar tu compra.</p>
        </section>
      ) : (
        <div className="cart-layout">
          <div className="cart-main">
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
                      src={obtenerUrlImagen(producto.imagen_url)}
                      alt={producto.nom_prod}
                      className="cart-item__image"
                      onError={(event) => {
                        event.currentTarget.onerror = null;

                        event.currentTarget.src =
                          "https://placehold.co/400x400/f1f5f9/9ca3af?text=Sin+imagen";
                      }}
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
                          disabled={
                            actualizando ||
                            producto.cantidad >= producto.stock_prod
                          }
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

            {esFactura && (
              <section className="cart-invoice">
                <div className="cart-invoice__header">
                  <div>
                    <span className="cart-invoice__eyebrow">Factura</span>

                    <h3>Datos de facturación</h3>

                    <p>
                      Ingresa los datos que se utilizarán para emitir la
                      factura.
                    </p>
                  </div>
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="rutEmpresa">RUT empresa</label>

                  <input
                    id="rutEmpresa"
                    type="text"
                    value={datosFactura.rut_empresa}
                    onChange={(e) =>
                      actualizarDatoFactura("rut_empresa", e.target.value)
                    }
                    placeholder="76.123.456-7"
                    disabled={iniciandoPago}
                  />
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="razonSocial">Razón social</label>

                  <input
                    id="razonSocial"
                    type="text"
                    value={datosFactura.razon_social}
                    onChange={(e) =>
                      actualizarDatoFactura("razon_social", e.target.value)
                    }
                    placeholder="Nombre o razón social"
                    disabled={iniciandoPago}
                  />
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="giroFactura">Giro</label>

                  <input
                    id="giroFactura"
                    type="text"
                    value={datosFactura.giro}
                    onChange={(e) =>
                      actualizarDatoFactura("giro", e.target.value)
                    }
                    placeholder="Actividad comercial"
                    disabled={iniciandoPago}
                  />
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="correoFactura">Correo</label>

                  <input
                    id="correoFactura"
                    type="email"
                    value={datosFactura.correo}
                    onChange={(e) =>
                      actualizarDatoFactura("correo", e.target.value)
                    }
                    placeholder="facturacion@empresa.cl"
                    disabled={iniciandoPago}
                  />
                </div>

                <div className="cart-invoice__field cart-invoice__field--wide">
                  <label htmlFor="direccionFactura">
                    Dirección de facturación
                  </label>

                  <input
                    id="direccionFactura"
                    type="text"
                    value={datosFactura.direccion_factura}
                    onChange={(e) =>
                      actualizarDatoFactura("direccion_factura", e.target.value)
                    }
                    placeholder="Ej: Av. Principal #123"
                    disabled={iniciandoPago}
                  />
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="regionFactura">Región</label>

                  <select
                    id="regionFactura"
                    value={idRegionFactura}
                    onChange={(e) => cambiarRegionFactura(e.target.value)}
                    disabled={cargandoUbicaciones || iniciandoPago}
                  >
                    <option value="">Seleccionar región</option>

                    {regiones.map((region) => (
                      <option key={region.id_reg} value={region.id_reg}>
                        {region.nom_reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="comunaFactura">Comuna</label>

                  <select
                    id="comunaFactura"
                    value={datosFactura.id_comuna}
                    onChange={(e) =>
                      actualizarDatoFactura("id_comuna", e.target.value)
                    }
                    disabled={
                      !idRegionFactura || cargandoUbicaciones || iniciandoPago
                    }
                  >
                    <option value="">Seleccionar comuna</option>

                    {comunasFiltradas.map((comuna) => (
                      <option key={comuna.id_comuna} value={comuna.id_comuna}>
                        {comuna.nom_comuna}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="telefonoFactura">Teléfono</label>

                  <input
                    id="telefonoFactura"
                    type="tel"
                    value={datosFactura.telefono}
                    onChange={(e) =>
                      actualizarDatoFactura("telefono", e.target.value)
                    }
                    placeholder="+56912345678"
                    disabled={iniciandoPago}
                  />
                </div>
              </section>
            )}
          </div>

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>

            <div className="cart-summary__row">
              <span>Subtotal</span>

              <strong>{formatearPrecio(subtotal)}</strong>
            </div>

            <div className="cart-summary__row">
              <span>Envío</span>

              <strong>{obtenerTextoEnvio()}</strong>
            </div>

            {/* =================================================
                MODALIDAD DE ENTREGA
            ================================================= */}
            <div className="cart-summary__shipping">
              <h3>Modalidad de entrega</h3>

              {!usuario && (
                <p className="cart-summary__shipping-message">
                  Inicia sesión para conocer tus opciones y costos de despacho.
                </p>
              )}

              {usuario && opcionesDespacho.length > 0 && (
                <div className="cart-summary__shipping-options">
                  {opcionesDespacho.map((tipo) => (
                    <label
                      key={tipo.id_tipo_despacho}
                      className="cart-summary__option"
                    >
                      <input
                        type="radio"
                        name="tipoDespacho"
                        value={tipo.id_tipo_despacho}
                        checked={
                          Number(idTipoDespachoSeleccionado) ===
                          Number(tipo.id_tipo_despacho)
                        }
                        onChange={() =>
                          cambiarTipoDespacho(tipo.id_tipo_despacho)
                        }
                        disabled={iniciandoPago}
                      />

                      <span className="cart-summary__shipping-option-content">
                        <strong>{tipo.nom_tipo_despacho}</strong>

                        <small>
                          {Number(tipo.costo) === 0
                            ? tipo.requiere_coordinacion
                              ? "Costo por coordinar"
                              : "Gratis"
                            : formatearPrecio(tipo.costo)}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__document">
              <h3>Documento tributario</h3>

              <label className="cart-summary__option">
                <input
                  type="radio"
                  name="tipoDocumentoTributario"
                  value="boleta"
                  checked={!esFactura}
                  onChange={() => cambiarTipoDocumento("boleta")}
                />

                <span>Boleta</span>
              </label>

              <label className="cart-summary__option">
                <input
                  type="radio"
                  name="tipoDocumentoTributario"
                  value="factura"
                  checked={esFactura}
                  onChange={() => cambiarTipoDocumento("factura")}
                />

                <span>Factura</span>
              </label>
            </div>

            <div className="cart-summary__divider" />

            <div className="cart-summary__total">
              <span>Total</span>

              <strong>{formatearPrecio(total)}</strong>
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

            <p
              className={
                requiereCoordinacion
                  ? "cart-summary__notice cart-summary__notice--important"
                  : "cart-summary__notice"
              }
            >
              {obtenerMensajeDespacho()}
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

export default Carrito;
