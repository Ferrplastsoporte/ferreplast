import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import TarjetaPedido from "../../components/pedidos/TarjetaPedido";
import {
  ESTADO_PEDIDO,
  ESTADOS_VISIBLES_CLIENTE,
  esVisibleParaCliente,
  obtenerNombreEstado,
} from "../../utils/Pedidos/estadoPedido";
import "./css/Pedido.css";

function Pedidos() {
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

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
          { codigo: errorUsuario?.code, estado: errorUsuario?.status }
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

      const [respuestaPedidos, respuestaEstados] = await Promise.all([
        supabase.rpc("obtener_mis_pedidos"),
        supabase.from("estado_pedido")
          .select("id_estado, nom_estado")
          .in("id_estado", ESTADOS_VISIBLES_CLIENTE.filter(
            (estado) => estado !== ESTADO_PEDIDO.PREPARACION,
          ))
          .order("id_estado"),
      ]);
      const { data, error: errorPedidos } = respuestaPedidos;
      if (respuestaEstados.error) throw respuestaEstados.error;
      setEstadosDisponibles((respuestaEstados.data || []).map((estado) => [
        Number(estado.id_estado), estado.nom_estado,
      ]));

      if (errorPedidos) {
        console.error(
          "Error cargando pedidos:",
          { codigo: errorPedidos?.code, estado: errorPedidos?.status }
        );

        setError(
          "No fue posible cargar tus pedidos."
        );

        setPedidos([]);
        return;
      }


      setPedidos(data || []);
    } catch (errorCarga) {
      console.error(
        "Error inesperado cargando pedidos:",
        { codigo: errorCarga?.code, estado: errorCarga?.status }
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
  // PEDIDOS VISIBLES
  // ==================================================

  // Qué estados ve el cliente: utils/pedidos/estadoPedido.js
  const pedidosConfirmados = pedidos.filter(esVisibleParaCliente);
  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta);
  const hayFiltros = Boolean(estadoSeleccionado || fechaDesde || fechaHasta);
  const pedidosFiltrados = pedidosConfirmados.filter((pedido) => {
    if (rangoInvalido) return false;
    if (estadoSeleccionado && Number(pedido.id_estado) !== Number(estadoSeleccionado)) return false;
    if (!fechaDesde && !fechaHasta) return true;
    const fecha = pedido.fecha_predido ? new Date(pedido.fecha_predido) : null;
    if (!fecha || Number.isNaN(fecha.getTime())) return false;
    // Usar el mismo día local que muestra la fecha de la tarjeta.
    const dia = [fecha.getFullYear(), String(fecha.getMonth() + 1).padStart(2, "0"),
      String(fecha.getDate()).padStart(2, "0")].join("-");
    return (!fechaDesde || dia >= fechaDesde) && (!fechaHasta || dia <= fechaHasta);
  }).sort((primero, segundo) =>
    (Date.parse(segundo.fecha_predido) || 0) - (Date.parse(primero.fecha_predido) || 0),
  );

  function limpiarFiltros() {
    setEstadoSeleccionado("");
    setFechaDesde("");
    setFechaHasta("");
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
        pedidosConfirmados.length === 0 && (

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
        pedidosConfirmados.length > 0 && (

          <section className="pedidos-content">

            <div className="cliente-pedidos__filtros" role="group" aria-label="Filtrar mis pedidos">
              <label htmlFor="cliente-pedidos-estado">
                Estado del pedido
                <select id="cliente-pedidos-estado" value={estadoSeleccionado}
                  onChange={(evento) => setEstadoSeleccionado(evento.target.value)}>
                  <option value="">Todos los estados</option>
                  {estadosDisponibles.map(([id, nombre]) => (
                    <option key={id} value={id}>{nombre}</option>
                  ))}
                </select>
              </label>
              <label htmlFor="cliente-pedidos-desde">
                Desde
                <input id="cliente-pedidos-desde" type="date" value={fechaDesde}
                  max={fechaHasta || undefined} aria-invalid={rangoInvalido}
                  aria-describedby={rangoInvalido ? "cliente-pedidos-error-fechas" : undefined}
                  onChange={(evento) => setFechaDesde(evento.target.value)} />
              </label>
              <label htmlFor="cliente-pedidos-hasta">
                Hasta
                <input id="cliente-pedidos-hasta" type="date" value={fechaHasta}
                  min={fechaDesde || undefined} aria-invalid={rangoInvalido}
                  aria-describedby={rangoInvalido ? "cliente-pedidos-error-fechas" : undefined}
                  onChange={(evento) => setFechaHasta(evento.target.value)} />
              </label>
              <button type="button" onClick={limpiarFiltros} disabled={!hayFiltros}>
                Limpiar filtros
              </button>
            </div>
            {rangoInvalido && (
              <p id="cliente-pedidos-error-fechas" className="cliente-pedidos__error-fechas" role="alert">
                La fecha desde debe ser anterior o igual a la fecha hasta.
              </p>
            )}

            {/* Resumen */}

            <div className="pedidos-summary" role="status" aria-live="polite">

              <div>

                <strong>
                  {pedidosFiltrados.length}
                </strong>

                <span>
                  {pedidosFiltrados.length === 1
                    ? "pedido"
                    : "pedidos"}
                </span>

              </div>

              <span>
                Más recientes primero
              </span>

            </div>


            {!rangoInvalido && pedidosFiltrados.length === 0 && (
              <div className="cliente-pedidos__sin-resultados">
                <p>No hay pedidos que coincidan con los filtros seleccionados.</p>
                <button type="button" onClick={limpiarFiltros}>Ver todos mis pedidos</button>
              </div>
            )}

            {/* Tarjetas */}

            <div className="pedidos-list">

              {pedidosFiltrados.map((pedido) => (

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
                    obtenerNombreEstado
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