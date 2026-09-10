import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "./css/DetallePedido.css";

function DetallePedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedido();
  }, [id]);

  // ==================================================
  // OBTENER PEDIDO
  // ==================================================

  async function cargarPedido() {
    setCargando(true);
    setError("");

    try {
      // ==================================================
      // OBTENER USUARIO AUTENTICADO
      // ==================================================

      const {
        data: { user },
        error: errorUsuario,
      } = await supabase.auth.getUser();

      if (errorUsuario) {
        console.error(
          "Error obteniendo usuario:",
          errorUsuario
        );

        setError(
          "No fue posible obtener tu sesión."
        );

        return;
      }

      if (!user) {
        setError(
          "Debes iniciar sesión para ver este pedido."
        );

        return;
      }

      // ==================================================
      // OBTENER PEDIDO
      // ==================================================

      const {
        data,
        error: errorPedido,
      } = await supabase
        .from("pedido")
        .select(`
          id_pedido,
          fecha_predido,
          total_pedido,
          id_estado,
          id_user,
          es_factura,
          registrado_erp,

          estado_pedido (
            id_estado,
            nom_estado
          ),

          detalle_pedido (
            id_detalle,
            cantidad,
            precio_unitario,
            id_prod,

            producto (
              id_prod,
              nom_prod,
              imagen_url
            )
          ),

          pago (
            id_pago,
            metodo_pago,
            fecha_pago,
            id_estado_pago,
            buy_order,
            monto_pago,
            estado_transbank,
            response_code,
            authorization_code,
            payment_type_code,
            installments_number
          )
        `)
        .eq("id_pedido", id)
        .eq("id_user", user.id)
        .single();

      if (errorPedido) {
        console.error(
          "ERROR COMPLETO DEL PEDIDO:",
          errorPedido
        );

        console.error(
          "Mensaje:",
          errorPedido.message
        );

        console.error(
          "Código:",
          errorPedido.code
        );

        console.error(
          "Detalles:",
          errorPedido.details
        );

        console.error(
          "Hint:",
          errorPedido.hint
        );

        setError(
          `No fue posible cargar el pedido: ${errorPedido.message}`
        );

        return;
      }

      setPedido(data);
    } catch (errorCarga) {
      console.error(
        "Error inesperado:",
        errorCarga
      );

      setError(
        "Ocurrió un error al cargar el pedido."
      );
    } finally {
      setCargando(false);
    }
  }

  // ==================================================
  // FORMATEAR PRECIO
  // ==================================================

  function formatearPrecio(precio) {
    return new Intl.NumberFormat(
      "es-CL",
      {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }
    ).format(Number(precio || 0));
  }

  // ==================================================
  // OBTENER URL DE IMAGEN
  // ==================================================

  function obtenerUrlImagen(imagenUrl) {
    if (!imagenUrl) {
      return null;
    }

    // Si ya es una URL completa,
    // la utilizamos directamente.
    if (
      imagenUrl.startsWith("http://") ||
      imagenUrl.startsWith("https://")
    ) {
      return imagenUrl;
    }

    // La BD guarda solamente la ruta:
    // producto/93/imagen.jpg
    //
    // El bucket es:
    // imagenes_productos

    const { data } = supabase.storage
      .from("imagenes_productos")
      .getPublicUrl(imagenUrl);

    return data?.publicUrl || null;
  }

  // ==================================================
  // FORMATEAR FECHA
  // ==================================================

  function formatearFecha(fecha) {
    if (!fecha) {
      return "Sin fecha";
    }

    return new Intl.DateTimeFormat(
      "es-CL",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(fecha));
  }

  // ==================================================
  // ESTADO DEL PEDIDO
  // ==================================================

  function obtenerEstadoPedido() {
    return (
      pedido?.estado_pedido?.nom_estado ||
      "Pendiente"
    );
  }

  // ==================================================
  // ESTADO DEL PAGO
  // ==================================================

  function obtenerEstadoPago() {
    const pago = Array.isArray(pedido?.pago)
      ? pedido.pago[0]
      : pedido?.pago;

    const estado = pago?.id_estado_pago;

    switch (estado) {
      case 0:
        return "Creado";

      case 1:
        return "Inicializado";

      case 2:
        return "Pagado";

      case 3:
        return "Rechazado";

      case 4:
        return "Abortado";

      case 5:
        return "Expirado";

      case 6:
        return "Error de confirmación";

      case 7:
        return "Reversado";

      case 8:
        return "Anulado";

      case 9:
        return "Parcialmente anulado";

      default:
        return "Sin información";
    }
  }

  // ==================================================
  // CARGANDO
  // ==================================================

  if (cargando) {
    return (
      <main className="detalle-pedido-page">

        <div className="detalle-pedido-status">

          <span className="detalle-pedido-spinner" />

          <p>
            Cargando pedido...
          </p>

        </div>

      </main>
    );
  }

  // ==================================================
  // ERROR
  // ==================================================

  if (error) {
    return (
      <main className="detalle-pedido-page">

        <div className="detalle-pedido-status">

          <h2>
            No pudimos cargar el pedido
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() => navigate("/pedidos")}
          >
            Volver a mis pedidos
          </button>

        </div>

      </main>
    );
  }

  // ==================================================
  // PEDIDO
  // ==================================================

  return (
    <main className="detalle-pedido-page">

      <section className="detalle-pedido-container">

        {/* ==================================================
            VOLVER
        ================================================== */}

        <button
          type="button"
          className="detalle-pedido-back"
          onClick={() => navigate("/pedidos")}
        >
          ← Volver a mis pedidos
        </button>


        {/* ==================================================
            ENCABEZADO
        ================================================== */}

        <div className="detalle-pedido-header">

          <div>

            <span>
              DETALLE DEL PEDIDO
            </span>

            <h1>
              Pedido #{pedido.id_pedido}
            </h1>

            <p>
              {formatearFecha(
                pedido.fecha_predido
              )}
            </p>

          </div>

          <div className="detalle-pedido-estado">
            {obtenerEstadoPedido()}
          </div>

        </div>


        {/* ==================================================
            PRODUCTOS
        ================================================== */}

        <section className="detalle-pedido-card">

          <h2>
            Productos
          </h2>

          <div className="detalle-pedido-productos">

            {(pedido.detalle_pedido || []).map(
              (detalle) => {

                const urlImagen =
                  obtenerUrlImagen(
                    detalle.producto?.imagen_url
                  );

                return (
                  <article
                    className="detalle-pedido-producto"
                    key={detalle.id_detalle}
                  >

                    <div className="detalle-pedido-producto-info">

                      {/* ==================================================
                          IMAGEN
                      ================================================== */}

                      <div className="detalle-pedido-producto-imagen">

                        {urlImagen ? (

                          <img
                            src={urlImagen}
                            alt={
                              detalle.producto?.nom_prod ||
                              "Producto"
                            }
                            onError={(e) => {
                              console.error(
                                "No se pudo cargar la imagen:",
                                urlImagen
                              );

                              e.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <span>
                            📦
                          </span>

                        )}

                      </div>


                      {/* ==================================================
                          INFORMACIÓN DEL PRODUCTO
                      ================================================== */}

                      <div>

                        <h3>
                          {detalle.producto?.nom_prod ||
                            "Producto"}
                        </h3>

                        <p>
                          Cantidad:{" "}
                          {detalle.cantidad}
                        </p>

                        <p>
                          Precio unitario:{" "}
                          {formatearPrecio(
                            detalle.precio_unitario
                          )}
                        </p>

                      </div>

                    </div>


                    {/* ==================================================
                        SUBTOTAL
                    ================================================== */}

                    <strong>
                      {formatearPrecio(
                        Number(
                          detalle.precio_unitario
                        ) *
                          Number(
                            detalle.cantidad
                          )
                      )}
                    </strong>

                  </article>
                );
              }
            )}

          </div>

        </section>


        {/* ==================================================
            INFORMACIÓN DE PAGO
        ================================================== */}

        <section className="detalle-pedido-card">

          <h2>
            Información de pago
          </h2>

          <div className="detalle-pedido-info">

            {/* MÉTODO DE PAGO */}

            <div>

              <span>
                Método de pago
              </span>

              <strong>
                {(
                  Array.isArray(pedido?.pago)
                    ? pedido.pago[0]
                    : pedido?.pago
                )?.metodo_pago === 1
                  ? "Webpay"
                  : "Otro método"}
              </strong>

            </div>


            {/* ESTADO DEL PAGO */}

            <div>

              <span>
                Estado del pago
              </span>

              <strong>
                {obtenerEstadoPago()}
              </strong>

            </div>


            {/* ORDEN DE COMPRA */}

            {(
              Array.isArray(pedido?.pago)
                ? pedido.pago[0]
                : pedido?.pago
            )?.buy_order && (

              <div>

                <span>
                  Orden de compra
                </span>

                <strong>
                  {(
                    Array.isArray(pedido?.pago)
                      ? pedido.pago[0]
                      : pedido?.pago
                  )?.buy_order}
                </strong>

              </div>

            )}

          </div>

        </section>


        {/* ==================================================
            DOCUMENTO
        ================================================== */}

        <section className="detalle-pedido-card">

          <h2>
            Documento
          </h2>

          <div className="detalle-pedido-info">

            {/* TIPO DE DOCUMENTO */}

            <div>

              <span>
                Tipo de documento
              </span>

              <strong>
                {pedido.es_factura
                  ? "Factura"
                  : "Boleta"}
              </strong>

            </div>


            {/* ESTADO ERP */}

            <div>

              <span>
                Estado ERP
              </span>

              <strong>
                {pedido.registrado_erp
                  ? "Registrado"
                  : "Pendiente"}
              </strong>

            </div>

          </div>

        </section>


        {/* ==================================================
            TOTAL
        ================================================== */}

        <section className="detalle-pedido-total">

          <span>
            Total del pedido
          </span>

          <strong>
            {formatearPrecio(
              pedido.total_pedido
            )}
          </strong>

        </section>

      </section>

    </main>
  );
}

export default DetallePedido;