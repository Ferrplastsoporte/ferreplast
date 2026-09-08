import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import TarjetaPedido from "../../components/pedidos/TarjetaPedido";
import "./css/pedido.css";

function Pedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPedidos();
  }, []);

  async function cargarPedidos() {
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

        setPedidos([]);
        return;
      }

      if (!user) {
        setError(
          "Debes iniciar sesión para ver tus pedidos."
        );

        setPedidos([]);
        return;
      }

      // ==================================================
      // OBTENER PEDIDOS MEDIANTE RPC
      // ==================================================

      const {
        data,
        error: errorPedidos,
      } = await supabase.rpc(
        "obtener_mis_pedidos"
      );

      if (errorPedidos) {
        console.error(
          "Error cargando pedidos:",
          errorPedidos
        );

        setError(
          "No fue posible cargar tus pedidos."
        );

        setPedidos([]);
        return;
      }

      console.log(
        "Pedidos obtenidos:",
        data
      );

      setPedidos(data || []);
    } catch (errorCarga) {
      console.error(
        "Error inesperado cargando pedidos:",
        errorCarga
      );

      setError(
        "Ocurrió un error al cargar tus pedidos."
      );

      setPedidos([]);
    } finally {
      setCargando(false);
    }
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
  // OBTENER ESTADO DEL PEDIDO
  // ==================================================

  function obtenerEstado(pedido) {
    const estado =
      pedido?.estado_pedido?.nom_estado;

    if (!estado) {
      return "pendiente";
    }

    return estado
      .toLowerCase()
      .trim()
      .replaceAll(" ", "_");
  }

  // ==================================================
  // VER DETALLE DEL PEDIDO
  // ==================================================

  function verDetallePedido(idPedido) {
    navigate(`/pedidos/${idPedido}`);
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <main className="pedidos-page">

      {/* ==================================================
          ENCABEZADO
      ================================================== */}

      <section className="pedidos-header">

        <span className="pedidos-eyebrow">
          MI CUENTA
        </span>

        <h1>
          Mis pedidos
        </h1>

        <p>
          Consulta tus compras, estados,
          productos y despachos.
        </p>

      </section>


      {/* ==================================================
          CARGANDO
      ================================================== */}

      {cargando && (
        <div className="pedidos-status">

          <span className="pedidos-spinner" />

          <p>
            Cargando tus pedidos...
          </p>

        </div>
      )}


      {/* ==================================================
          ERROR
      ================================================== */}

      {!cargando && error && (
        <div className="pedidos-status pedidos-status--error">

          <h2>
            No pudimos cargar tus pedidos
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={cargarPedidos}
          >
            Reintentar
          </button>

        </div>
      )}


      {/* ==================================================
          SIN PEDIDOS
      ================================================== */}

      {!cargando &&
        !error &&
        pedidos.length === 0 && (

          <div className="pedidos-status pedidos-status--empty">

            <div className="pedidos-empty-icon">
              🛒
            </div>

            <h2>
              Aún no tienes pedidos
            </h2>

            <p>
              Cuando realices una compra,
              aquí podrás consultar su estado.
            </p>

          </div>
        )}


      {/* ==================================================
          LISTA DE PEDIDOS
      ================================================== */}

      {!cargando &&
        !error &&
        pedidos.length > 0 && (

          <section className="pedidos-content">

            {/* Resumen */}

            <div className="pedidos-summary">

              <div>

                <strong>
                  {pedidos.length}
                </strong>

                <span>
                  {pedidos.length === 1
                    ? "pedido"
                    : "pedidos"}
                </span>

              </div>

              <span>
                Más recientes primero
              </span>

            </div>


            {/* Tarjetas */}

            <div className="pedidos-list">

              {pedidos.map((pedido) => (

                <TarjetaPedido
                  key={pedido.id_pedido}

                  pedido={pedido}

                  formatearFecha={
                    formatearFecha
                  }

                  formatearPrecio={
                    formatearPrecio
                  }

                  obtenerEstado={
                    obtenerEstado
                  }

                  onVerDetalle={() =>
                    verDetallePedido(
                      pedido.id_pedido
                    )
                  }
                />

              ))}

            </div>

          </section>
        )}

    </main>
  );
}

export default Pedidos;