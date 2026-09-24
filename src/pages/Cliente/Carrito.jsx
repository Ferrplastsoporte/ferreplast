import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useVistaCarrito from "../../hooks/useVistaCarrito";
import useFacturacionCompra from "../../hooks/useFacturacionCompra";
import { supabase } from "../../lib/supabase";
import { LONGITUD_MAXIMA_CORREO } from "../../utils/comunes/correo";
import { LIMITES_FACTURACION } from "../../utils/facturacion/validacionFacturacion";
import "./css/Carrito.css";

const CAMPOS_FACTURA_POR_ID = {
  rut_empresa: "rutEmpresa",
  razon_social: "razonSocial",
  giro: "giroFactura",
  correo: "correoFactura",
  direccion_factura: "direccionFactura",
  id_region: "regionFactura",
  id_comuna: "comunaFactura",
  telefono: "telefonoFactura",
};

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
  const [idRegionDespacho, setIdRegionDespacho] = useState("");
  const [cargandoUbicaciones, setCargandoUbicaciones] = useState(false);

  const {
    esFactura,
    datosFactura,
    erroresFactura,
    seleccionarTipoDocumento,
    actualizarDatoFactura,
    validarCampoFactura,
    validarFactura,
    obtenerDatosFacturacion,
  } = useFacturacionCompra();

  const {
    productos,
    cargando,
    actualizando,
    error,
    usuario,
    idComuna,

    // Datos del despacho
    direccionUsuario,
    idComunaDespacho,
    direccionDespacho,
    editandoDireccion,

    opcionesDespacho,
    idTipoDespachoSeleccionado,
    despachoSeleccionado,

    esRetiroTienda,
    esDespachoUrbano,
    esDespachoAledano,

    despachoListo,
    requiereCoordinacion,
    subtotal,
    envio,
    total,

    seleccionarTipoDespacho,

    iniciarEdicionDireccion,
    cancelarEdicionDireccion,
    actualizarDireccionDespacho,
    actualizarComunaDespacho,
    confirmarDireccionDespacho,

    cambiarCantidad,
    eliminarProducto,
    vaciarCarritoCompleto,
  } = useVistaCarrito();

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

  const comunasFiltradas = datosFactura.id_region
    ? comunas.filter(
        (comuna) => Number(comuna.id_reg) === Number(datosFactura.id_region),
      )
    : [];

  const comunaDespachoActual = comunas.find(
    (comuna) => Number(comuna.id_comuna) === Number(idComunaDespacho),
  );

  const comunasDespachoFiltradas = idRegionDespacho
    ? comunas.filter(
        (comuna) => Number(comuna.id_reg) === Number(idRegionDespacho),
      )
    : [];

  useEffect(() => {
    if (comunaDespachoActual) {
      setIdRegionDespacho(String(comunaDespachoActual.id_reg));
    }
  }, [comunaDespachoActual]);

  function cambiarRegionFactura(valor) {
    actualizarDatoFactura("id_region", valor);
    actualizarDatoFactura("id_comuna", "");
    setErrorPago("");
  }

  function cambiarRegionDespacho(valor) {
    setIdRegionDespacho(valor);
    actualizarComunaDespacho("");
    setErrorPago("");
  }

  function cambiarTipoDocumento(tipo) {
    seleccionarTipoDocumento(tipo);
    setErrorPago("");
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

    // ==================================================
    // VALIDAR DESPACHO
    // ==================================================

    if (!despachoListo || !despachoSeleccionado) {
      setErrorPago("Selecciona una modalidad de entrega antes de continuar.");

      return;
    }

    // ==================================================
    // VALIDAR FACTURACIÓN
    // ==================================================

    const validacionFactura = validarFactura({ comunas });

    if (!validacionFactura.valido) {
      setErrorPago(validacionFactura.mensaje);

      const primerCampoInvalido = Object.keys(
        validacionFactura.errores ?? {},
      )[0];
      const idCampo = CAMPOS_FACTURA_POR_ID[primerCampoInvalido];

      requestAnimationFrame(() => {
        document.getElementById(idCampo)?.focus();
      });

      return;
    }

    // ==================================================
    // VALIDAR TOTAL
    // ==================================================

    if (!Number.isInteger(Math.round(total)) || total <= 0) {
      setErrorPago("El total de la compra no es válido.");

      return;
    }

    // ==================================================
    // PREPARAR FACTURACIÓN
    // ==================================================

    const facturacion = obtenerDatosFacturacion();

    // ==================================================
    // PREPARAR DESPACHO
    // ==================================================

    const datosDespacho = {
      id_tipo_despacho: Number(despachoSeleccionado.id_tipo_despacho),

      nom_tipo_despacho: despachoSeleccionado.nom_tipo_despacho,

      costo_envio: Number(envio),

      requiere_coordinacion: requiereCoordinacion,

      direccion_despacho: direccionDespacho.trim(),
    };

    // ==================================================
    // GUARDAR INFORMACIÓN TEMPORAL DEL CHECKOUT
    // ==================================================

    sessionStorage.setItem(
      "ferreplast_checkout_facturacion",
      JSON.stringify(facturacion),
    );

    sessionStorage.setItem(
      "ferreplast_checkout_despacho",
      JSON.stringify(datosDespacho),
    );

    console.log("Facturación preparada:", facturacion);

    console.log("Despacho preparado:", datosDespacho);

    // ==================================================
    // INICIAR PAGO
    // ==================================================

    setIniciandoPago(true);

    try {
      // ==================================================
      // OBTENER SESIÓN AUTENTICADA
      // ==================================================

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No se encontró una sesión válida.");
      }

      // ==================================================
      // CREAR PEDIDO + DESPACHO + FACTURA + PAGO
      // ==================================================

            console.log("BODY FINAL WEBPAY:", {
              userId: usuario.id,
              accessToken: "RECIBIDO",
              idTipoDespacho: Number(despachoSeleccionado.id_tipo_despacho),
              idComuna: Number(idComunaDespacho),
              direccionDespacho: direccionDespacho,
              esFactura: Boolean(esFactura),
              facturacion: esFactura ? facturacion?.detalle_factura : null,
            });
            console.log("SESSION USER:", session.user.id);
            console.log("USUARIO CARRITO:", usuario.id);
            const { data, error } = await supabase.functions.invoke(
        "webpay-create",
        {
          body: {
            idTipoDespacho: Number(
              despachoSeleccionado.id_tipo_despacho
            ),

            idComuna: Number(idComunaDespacho),

            direccionDespacho: direccionDespacho,

            esFactura: Boolean(esFactura),

            facturacion: esFactura
              ? facturacion?.detalle_factura
              : null,
          },
        }
      );

      if (error) {
        console.error(
          "Error llamando webpay-create:",
          error
        );

        throw new Error(
          error.message || "No se pudo iniciar Webpay"
        );
      }

      if (!data?.ok) {
        throw new Error(
          data?.error ||
            "No se pudo crear la transacción Webpay"
        );
      }

      console.log("Pago Webpay iniciado:", {
        idPedido: data.idPedido,
        idPago: data.idPago,
        buyOrder: data.buyOrder,
        monto: data.monto,
      });
      // ==================================================
      // REDIRIGIR A WEBPAY
      // ==================================================

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
                    onBlur={() => validarCampoFactura("rut_empresa")}
                    placeholder="76123456-7"
                    maxLength={LIMITES_FACTURACION.rut_empresa}
                    required
                    aria-invalid={Boolean(erroresFactura.rut_empresa)}
                    aria-describedby={
                      erroresFactura.rut_empresa ? "errorRutEmpresa" : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.rut_empresa && (
                    <small id="errorRutEmpresa" className="cart-invoice__error">
                      {erroresFactura.rut_empresa}
                    </small>
                  )}
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
                    onBlur={() => validarCampoFactura("razon_social")}
                    placeholder="Nombre o razón social"
                    maxLength={LIMITES_FACTURACION.razon_social}
                    required
                    aria-invalid={Boolean(erroresFactura.razon_social)}
                    aria-describedby={
                      erroresFactura.razon_social
                        ? "errorRazonSocial"
                        : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.razon_social && (
                    <small
                      id="errorRazonSocial"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.razon_social}
                    </small>
                  )}
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
                    onBlur={() => validarCampoFactura("giro")}
                    placeholder="Actividad comercial"
                    maxLength={LIMITES_FACTURACION.giro}
                    required
                    aria-invalid={Boolean(erroresFactura.giro)}
                    aria-describedby={
                      erroresFactura.giro ? "errorGiroFactura" : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.giro && (
                    <small
                      id="errorGiroFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.giro}
                    </small>
                  )}
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
                    onBlur={() => validarCampoFactura("correo")}
                    placeholder="facturacion@empresa.cl"
                    maxLength={LONGITUD_MAXIMA_CORREO}
                    required
                    aria-invalid={Boolean(erroresFactura.correo)}
                    aria-describedby={
                      erroresFactura.correo ? "errorCorreoFactura" : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.correo && (
                    <small
                      id="errorCorreoFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.correo}
                    </small>
                  )}
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
                    onBlur={() => validarCampoFactura("direccion_factura")}
                    placeholder="Ej: Av. Principal #123"
                    maxLength={LIMITES_FACTURACION.direccion_factura}
                    required
                    aria-invalid={Boolean(erroresFactura.direccion_factura)}
                    aria-describedby={
                      erroresFactura.direccion_factura
                        ? "errorDireccionFactura"
                        : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.direccion_factura && (
                    <small
                      id="errorDireccionFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.direccion_factura}
                    </small>
                  )}
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="regionFactura">Región</label>

                  <select
                    id="regionFactura"
                    value={datosFactura.id_region}
                    onChange={(e) => cambiarRegionFactura(e.target.value)}
                    onBlur={() => validarCampoFactura("id_region")}
                    required
                    aria-invalid={Boolean(erroresFactura.id_region)}
                    aria-describedby={
                      erroresFactura.id_region
                        ? "errorRegionFactura"
                        : undefined
                    }
                    disabled={cargandoUbicaciones || iniciandoPago}
                  >
                    <option value="">Seleccionar región</option>

                    {regiones.map((region) => (
                      <option key={region.id_reg} value={region.id_reg}>
                        {region.nom_reg}
                      </option>
                    ))}
                  </select>
                  {erroresFactura.id_region && (
                    <small
                      id="errorRegionFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.id_region}
                    </small>
                  )}
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="comunaFactura">Comuna</label>

                  <select
                    id="comunaFactura"
                    value={datosFactura.id_comuna}
                    onChange={(e) =>
                      actualizarDatoFactura("id_comuna", e.target.value)
                    }
                    onBlur={() => validarCampoFactura("id_comuna")}
                    required
                    aria-invalid={Boolean(erroresFactura.id_comuna)}
                    aria-describedby={
                      erroresFactura.id_comuna
                        ? "errorComunaFactura"
                        : undefined
                    }
                    disabled={
                      !datosFactura.id_region ||
                      cargandoUbicaciones ||
                      iniciandoPago
                    }
                  >
                    <option value="">Seleccionar comuna</option>

                    {comunasFiltradas.map((comuna) => (
                      <option key={comuna.id_comuna} value={comuna.id_comuna}>
                        {comuna.nom_comuna}
                      </option>
                    ))}
                  </select>
                  {erroresFactura.id_comuna && (
                    <small
                      id="errorComunaFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.id_comuna}
                    </small>
                  )}
                </div>

                <div className="cart-invoice__field">
                  <label htmlFor="telefonoFactura">
                    Teléfono{" "}
                    <span className="cart-invoice__optional">(opcional)</span>
                  </label>

                  <input
                    id="telefonoFactura"
                    type="tel"
                    value={datosFactura.telefono}
                    onChange={(e) =>
                      actualizarDatoFactura("telefono", e.target.value)
                    }
                    onBlur={() => validarCampoFactura("telefono")}
                    placeholder="+56912345678"
                    maxLength={LIMITES_FACTURACION.telefono}
                    aria-invalid={Boolean(erroresFactura.telefono)}
                    aria-describedby={
                      erroresFactura.telefono
                        ? "errorTelefonoFactura"
                        : undefined
                    }
                    disabled={iniciandoPago}
                  />
                  {erroresFactura.telefono && (
                    <small
                      id="errorTelefonoFactura"
                      className="cart-invoice__error"
                    >
                      {erroresFactura.telefono}
                    </small>
                  )}
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
                  {opcionesDespacho.map((tipo) => {
                    const nombreTipo =
                      tipo.nom_tipo_despacho?.toLowerCase() || "";

                    const esRetiro = nombreTipo.includes("retiro");

                    const esUrbano = nombreTipo.includes("urbano");

                    const esAledano = nombreTipo.includes("aledaño");

                    const seleccionado =
                      Number(idTipoDespachoSeleccionado) ===
                      Number(tipo.id_tipo_despacho);

                    return (
                      <div key={tipo.id_tipo_despacho}>
                        <label className="cart-summary__option">
                          <input
                            type="radio"
                            name="tipoDespacho"
                            value={tipo.id_tipo_despacho}
                            checked={seleccionado}
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

                        {/* RETIRO EN TIENDA */}

                        {seleccionado && esRetiro && (
                          <div className="cart-summary__shipping-detail">
                            <p>
                              Tu pedido quedará disponible para retiro en
                              tienda.
                            </p>
                          </div>
                        )}

                        {/* DESPACHO */}

                        {seleccionado && !esRetiro && (
                          <div className="cart-summary__shipping-detail">
                            {!editandoDireccion ? (
                              <>
                                <div className="cart-summary__address">
                                  <strong>Dirección de despacho</strong>

                                  <p>{direccionDespacho || "Sin dirección"}</p>

                                  <p>
                                    {comunaDespachoActual?.nom_comuna ||
                                      "Sin comuna"}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="cart-summary__edit-address"
                                  onClick={iniciarEdicionDireccion}
                                  disabled={iniciandoPago}
                                >
                                  Modificar dirección
                                </button>
                              </>
                            ) : (
                              <div className="cart-summary__address-edit">
                                {/* DIRECCIÓN */}

                                <div className="cart-summary__field">
                                  <label htmlFor="direccionDespacho">
                                    Dirección
                                  </label>

                                  <input
                                    id="direccionDespacho"
                                    type="text"
                                    value={direccionDespacho}
                                    onChange={(e) =>
                                      actualizarDireccionDespacho(
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Ingresa tu dirección"
                                    disabled={iniciandoPago}
                                  />
                                </div>

                                {/* REGIÓN Y COMUNA */}

                                {esAledano && (
                                  <div className="cart-summary__field">
                                    <label htmlFor="regionDespacho">
                                      Región
                                    </label>

                                    <select
                                      id="regionDespacho"
                                      value={idRegionDespacho}
                                      onChange={(e) =>
                                        cambiarRegionDespacho(e.target.value)
                                      }
                                      disabled={
                                        iniciandoPago || cargandoUbicaciones
                                      }
                                    >
                                      <option value="">
                                        Selecciona una región
                                      </option>

                                      {regiones.map((region) => (
                                        <option
                                          key={region.id_reg}
                                          value={region.id_reg}
                                        >
                                          {region.nom_reg}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div className="cart-summary__field">
                                  <label htmlFor="comunaDespacho">Comuna</label>

                                  {esAledano ? (
                                    <select
                                      id="comunaDespacho"
                                      value={idComunaDespacho || ""}
                                      onChange={(e) =>
                                        actualizarComunaDespacho(e.target.value)
                                      }
                                      disabled={
                                        iniciandoPago ||
                                        cargandoUbicaciones ||
                                        !idRegionDespacho
                                      }
                                    >
                                      <option value="">
                                        {idRegionDespacho
                                          ? "Selecciona una comuna"
                                          : "Primero selecciona una región"}
                                      </option>

                                      {comunasDespachoFiltradas.map(
                                        (comuna) => (
                                          <option
                                            key={comuna.id_comuna}
                                            value={comuna.id_comuna}
                                          >
                                            {comuna.nom_comuna}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={
                                        comunaDespachoActual?.nom_comuna ||
                                        "Puerto Montt"
                                      }
                                      disabled
                                    />
                                  )}
                                </div>

                                {/* MENSAJE URBANO */}

                                {esUrbano && (
                                  <small className="cart-summary__shipping-message">
                                    El despacho urbano está disponible solamente
                                    dentro de Puerto Montt urbano.
                                  </small>
                                )}

                                {/* BOTONES */}

                                <div className="cart-summary__address-actions">
                                  <button
                                    type="button"
                                    className="cart-summary__confirm-address"
                                    onClick={confirmarDireccionDespacho}
                                    disabled={iniciandoPago}
                                  >
                                    Confirmar dirección
                                  </button>

                                  <button
                                    type="button"
                                    className="cart-summary__cancel-address"
                                    onClick={cancelarEdicionDireccion}
                                    disabled={iniciandoPago}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="cart-summary__divider" />

            {/* ================================================= 
                DOCUMENTO TRIBUTARIO
            ================================================= */}

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

            {/* ================================================= 
                TOTAL
            ================================================= */}

            <div className="cart-summary__total">
              <span>Total</span>

              <strong>{formatearPrecio(total)}</strong>
            </div>

            {/* ================================================= 
                BOTÓN WEBPAY
            ================================================= */}

            <button
              type="button"
              className="cart-summary__pay-button"
              onClick={continuarCompra}
              disabled={
                productos.length === 0 ||
                cargando ||
                actualizando ||
                iniciandoPago ||
                !despachoListo
              }
            >
              {iniciandoPago ? "Redirigiendo a Webpay..." : "Pagar con Webpay"}
            </button>

            {/* ================================================= 
                MENSAJE DESPACHO
            ================================================= */}

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
