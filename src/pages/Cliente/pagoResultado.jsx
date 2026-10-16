import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase"; // ajusta la ruta si es distinta
import "./css/PagoResultado.css";

const ESTADO_PAGO_APROBADO = 2;

function PagoResultado() {
  const [params] = useSearchParams();
  const estado = params.get("estado");

  // Webpay envía "pedido" y Banco de Chile "idPedido"
  const idPedido = params.get("pedido") || params.get("idPedido");

  const [pedido, setPedido] = useState(null);
  const [esperando, setEsperando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const mensajes = {
    aprobado: "Pago aprobado correctamente.",
    rechazado: "El pago fue rechazado.",
    cancelado: "El pago fue cancelado.",
    error: "Ocurrió un error al procesar el pago.",
  };

  // ==================================================
  // ESPERAR A QUE SE GENERE EL COMPROBANTE
  // ==================================================

  useEffect(() => {
    if (estado !== "aprobado" || !idPedido) return;

    let cancelado = false;

    async function esperarComprobante() {
      setEsperando(true);

      for (let i = 0; i < 15 && !cancelado; i++) {
        const { data, error } = await supabase
          .from("pedido")
          .select(`
            id_pedido,
            folio_pedido,
            total_pedido,
            comprobante_path,
            pago ( id_estado_pago )
          `)
          .eq("id_pedido", Number(idPedido))
          .single();

        if (error) {
          console.error("Error consultando pedido:", error);
        }

        if (data && !cancelado) {
          setPedido(data);
        }

        if (data?.comprobante_path) break;

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!cancelado) setEsperando(false);
    }

    esperarComprobante();

    return () => {
      cancelado = true;
    };
  }, [estado, idPedido]);

  // ==================================================
  // VERIFICAR PAGO REAL (no confiar solo en la URL)
  // ==================================================

  const pagos = Array.isArray(pedido?.pago)
    ? pedido.pago
    : pedido?.pago
      ? [pedido.pago]
      : [];

  const pagoConfirmado = pagos.some(
    (p) => Number(p.id_estado_pago) === ESTADO_PAGO_APROBADO
  );

  // ==================================================
  // DESCARGAR COMPROBANTE
  // ==================================================

  async function descargarComprobante() {
    if (!pedido?.comprobante_path) return;

    setDescargando(true);

    try {
      const { data, error } = await supabase.storage
        .from("comprobantes")
        .createSignedUrl(pedido.comprobante_path, 60, {
          download: `comprobante-${pedido.folio_pedido || pedido.id_pedido}.pdf`,
        });

      if (error) {
        console.error("Error descargando comprobante:", error);
        alert("No fue posible descargar el comprobante.");
        return;
      }

      window.location.href = data.signedUrl;
    } finally {
      setDescargando(false);
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

  const esAprobado = estado === "aprobado";

  // ==================================================
  // VISTA
  // ==================================================

  return (
    <main className={`pago-resultado ${estado || "desconocido"}`}>
      <div className="pago-card">

        <div className="pago-icono">
          {estado === "aprobado" && "✓"}
          {estado === "rechazado" && "✕"}
          {estado === "cancelado" && "!"}
          {estado === "error" && "!"}
          {!mensajes[estado] && "?"}
        </div>

        <h1>Resultado del pago</h1>

        <p>
          {mensajes[estado] || "Estado de pago no disponible."}
        </p>

        {/* ================= DATOS DE LA COMPRA ================= */}

        {esAprobado && pedido && (
          <p className="pago-detalle">
            Compra folio N°{" "}
            <strong>{pedido.folio_pedido || pedido.id_pedido}</strong>
            {" "}por{" "}
            <strong>{formatearPrecio(pedido.total_pedido)}</strong>
          </p>
        )}

        {/* ================= ACCIONES ================= */}

        <div className="pago-acciones">

          {esAprobado ? (
            <>
              {pedido?.comprobante_path && pagoConfirmado ? (
                <button
                  type="button"
                  className="pago-boton"
                  onClick={descargarComprobante}
                  disabled={descargando}
                >
                  {descargando
                    ? "Descargando..."
                    : "Descargar comprobante de pago"}
                </button>
              ) : esperando ? (
                <button
                  type="button"
                  className="pago-boton"
                  disabled
                >
                  Generando comprobante...
                </button>
              ) : (
                <p className="pago-aviso">
                  Tu comprobante estará disponible en unos minutos
                  en el detalle de tu pedido.
                </p>
              )}

              <Link
                to="/"
                className="pago-boton pago-boton--secundario"
              >
                Volver al inicio
              </Link>

              {idPedido && (
                <Link
                  to={`/pedidos/${idPedido}`}
                  className="pago-enlace"
                >
                  Ver detalle del pedido
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/carrito" className="pago-boton">
                Volver al carrito
              </Link>

              <Link
                to="/"
                className="pago-boton pago-boton--secundario"
              >
                Volver al inicio
              </Link>
            </>
          )}

        </div>

      </div>
    </main>
  );
}

export default PagoResultado;