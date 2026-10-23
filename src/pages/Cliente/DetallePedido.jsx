import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  obtenerAvisoCliente,
  obtenerNombreEstado,
} from "../../utils/Pedidos/estadoPedido";
import "./css/DetallePedido.css";

function DetallePedido() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState(false);

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
        console.error("Error obteniendo usuario:", errorUsuario);
        setError("No fue posible obtener tu sesión.");
        return;
      }

      if (!user) {
        setError("Debes iniciar sesión para ver este pedido.");
        return;
      }

      // ==================================================
      // OBTENER DETALLE DEL PEDIDO
      // ==================================================

      const { data, error: errorPedido } = await supabase.rpc(
        "obtener_detalle_pedido",
        {
          p_id_pedido: Number(id),
        }
      );

      if (errorPedido) {
        console.error("ERROR OBTENIENDO DETALLE DEL PEDIDO:", errorPedido);
        setError(`No fue posible cargar el pedido: ${errorPedido.message}`);
        return;
      }

      // La función retorna TABLE, por lo que puede venir como array
      const pedidoData = Array.isArray(data) ? data[0] : data;

      if (!pedidoData) {
        setError("No se encontró el pedido.");
        return;
      }

      // ==================================================
      // OBTENER FOLIO Y COMPROBANTE
      // ==================================================

      const { data: datosExtra } = await supabase
        .from("pedido")
        .select("folio_pedido, comprobante_path")
        .eq("id_pedido", Number(id))
        .single();

      pedidoData.folio_pedido = datosExtra?.folio_pedido || null;
      pedidoData.comprobante_path = datosExtra?.comprobante_path || null;

      setPedido(pedidoData);

    } catch (errorCarga) {
      console.error("Error inesperado:", errorCarga);
      setError("Ocurrió un error al cargar el pedido.");

    } finally {
      setCargando(false);
    }
  }

  // ==================================================
  // FORMATEAR PRECIO
  // ==================================================

  function formatearPrecio(precio) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(Number(precio || 0));
  }

  // ==================================================
  // OBTENER URL DE IMAGEN
  // ==================================================

  function obtenerUrlImagen(imagenUrl) {
    if (!imagenUrl) {
      return null;
    }

    // Si ya es una URL completa, se usa directamente
    if (
      imagenUrl.startsWith("http://") ||
      imagenUrl.startsWith("https://")
    ) {
      return imagenUrl;
    }

    // La BD guarda solo la ruta (bucket imagenes_productos)
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

    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(fecha));
  }

  // ==================================================
  // DESCARGAR COMPROBANTE
  // ==================================================

  async function descargarComprobante() {
    if (!pedido?.comprobante_path) return;

    setDescargando(true);

    try {
      const { data, error: errorDescarga } = await supabase.storage
        .from("comprobantes")
        .createSignedUrl(pedido.comprobante_path, 60, {
          download: `comprobante-${pedido.folio_pedido || pedido.id_pedido}.pdf`,
        });

      if (errorDescarga) {
        console.error("Error descargando comprobante:", errorDescarga);
        alert("No fue posible descargar el comprobante.");
        return;
      }

      window.location.href = data.signedUrl;
    } finally {
      setDescargando(false);
    }
  }

  // ==================================================
  // ESTADO DEL PEDIDO
  // ==================================================

  function obtenerEstadoPedido() {
    return obtenerNombreEstado(pedido);
  }

  // ==================================================
  // OBTENER PAGO
  // ==================================================

  function obtenerPago() {
    if (Array.isArray(pedido?.pago)) {
      return pedido.pago[0];
    }

    return pedido?.pago;
  }

  // ==================================================
  // OBTENER DESPACHO
  // ==================================================

  function obtenerDespacho() {
    if (Array.isArray(pedido?.despacho)) {
      return pedido.despacho[0];
    }

    return pedido?.despacho;
  }

  // ==================================================
  // CARGANDO
  // ==================================================

  if (cargando) {
    return (
      <main className="detalle-pedido-page">
        <div className="detalle-pedido-status">
          <span className="detalle-pedido-spinner" />
          <p>Cargando pedido...</p>
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
          <h2>No pudimos cargar el pedido</h2>
          <p>{error}</p>
          <button type="button" onClick={() => navigate("/pedidos")}>
            Volver a mis pedidos
          </button>
        </div>
      </main>
    );
  }

  const pago = obtenerPago();
  const despacho = obtenerDespacho();

  // ==================================================
  // PEDIDO
  // ==================================================

  return (
    <main className="detalle-pedido-page">

      <section className="detalle-pedido-container">

        {/* ================= VOLVER ================= */}

        <button
          type="button"
          className="detalle-pedido-back"
          onClick={() => navigate("/pedidos")}
        >
          ← Volver a mis pedidos
        </button>

        {/* ================= ENCABEZADO ================= */}

        <div className="detalle-pedido-header">

          <div>
            <span>DETALLE DEL PEDIDO</span>

            <h1>Pedido N° {pedido.folio_pedido || "Sin folio"}</h1>

            <p>{formatearFecha(pedido.fecha_predido)}</p>
          </div>

          <div className="detalle-pedido-estado">
            {obtenerEstadoPedido()}
          </div>

        </div>

        {/* ================= AVISO PEDIDO LISTO ================= */}

        {obtenerAvisoCliente(pedido) && (
          <p className="detalle-pedido-aviso-listo" role="status">
            {obtenerAvisoCliente(pedido)}
          </p>
        )}

        {/* ================= PRODUCTOS ================= */}

        <section className="detalle-pedido-card">

          <h2>Productos</h2>

          <div className="detalle-pedido-productos">

            {(pedido.detalle_pedido || []).map((detalle) => {
              const urlImagen = obtenerUrlImagen(detalle.producto?.imagen_url);

              return (
                <article
                  className="detalle-pedido-producto"
                  key={detalle.id_detalle}
                >
                  <div className="detalle-pedido-producto-info">

                    {/* IMAGEN */}
                    <div className="detalle-pedido-producto-imagen">
                      {urlImagen ? (
                        <img
                          src={urlImagen}
                          alt={detalle.producto?.nom_prod || "Producto"}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>📦</span>
                      )}
                    </div>

                    {/* INFORMACIÓN DEL PRODUCTO */}
                    <div>
                      <h3>{detalle.producto?.nom_prod || "Producto"}</h3>
                      <p>Cantidad: {detalle.cantidad}</p>
                      <p>
                        Precio unitario:{" "}
                        {formatearPrecio(detalle.precio_unitario)}
                      </p>
                    </div>

                  </div>

                  {/* SUBTOTAL */}
                  <strong>
                    {formatearPrecio(
                      Number(detalle.precio_unitario) * Number(detalle.cantidad)
                    )}
                  </strong>
                </article>
              );
            })}

          </div>

        </section>

        {/* ================= DESPACHO ================= */}

        <section className="detalle-pedido-card">

          <h2>Despacho</h2>

          <div className="detalle-pedido-info">

            <div>
              <span>Tipo de despacho</span>
              <strong>
                {despacho?.tipo_despacho?.nom_tipo_despacho || "Sin información"}
              </strong>
            </div>

            <div>
              <span>Costo de despacho</span>
              <strong>{despacho?.costo_mostrar || "Por definir"}</strong>
            </div>

            {despacho?.mostrar_direccion && (
              <div>
                <span>Dirección de envío</span>
                <strong>
                  {despacho?.direccion_despacho || "Sin dirección registrada"}
                </strong>
                {despacho?.comuna_despacho && (
                  <small>{despacho.comuna_despacho}</small>
                )}
              </div>
            )}

          </div>

        </section>

        {/* ================= INFORMACIÓN DE PAGO ================= */}

        <section className="detalle-pedido-card">

          <h2>Información de pago</h2>

          <div className="detalle-pedido-info">

            <div>
              <span>Método de pago</span>
              <strong>{pago?.metodo_pago === 1 ? "Webpay" : "Otro método"}</strong>
            </div>

            <div>
              <span>Estado del pago</span>
              <strong>
                {pago?.estado_pago?.nom_estado_pago || "Sin información"}
              </strong>
            </div>

            {pago?.buy_order && (
              <div>
                <span>Orden de compra</span>
                <strong>{pago.buy_order}</strong>
              </div>
            )}

          </div>

        </section>

        {/* ================= DOCUMENTO ================= */}

        <section className="detalle-pedido-card">

          <h2>Documento</h2>

          <div className="detalle-pedido-info">

            <div>
              <span>Tipo de documento</span>
              <strong>{pedido.es_factura ? "Factura" : "Boleta"}</strong>
            </div>

            <div>
              <span>Estado ERP</span>
              <strong>{pedido.registrado_erp ? "Registrado" : "Pendiente"}</strong>
            </div>

            {/* COMPROBANTE DE PAGO */}
            <div>
              <span>Comprobante de pago</span>

              {pedido.comprobante_path ? (
                <button
                  type="button"
                  className="detalle-pedido-descargar"
                  onClick={descargarComprobante}
                  disabled={descargando}
                >
                  {descargando ? "Descargando..." : "Descargar comprobante"}
                </button>
              ) : (
                <strong>Disponible cuando se confirme el pago</strong>
              )}
            </div>

          </div>

        </section>

        {/* ================= TOTAL ================= */}

        <section className="detalle-pedido-total">
          <span>Total del pedido</span>
          <strong>{formatearPrecio(pedido.total_pedido)}</strong>
        </section>

      </section>

    </main>
  );
}

export default DetallePedido;