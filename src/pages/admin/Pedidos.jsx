
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminHeader from "./components/AdminHeader";
import "./css/Pedidos.css";
function formatearFecha(fecha) {
  if (!fecha) return "—";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const { data, error: errorConsulta } = await supabase.rpc(
        "obtener_pedidos_admin"
      );

      if (errorConsulta) throw errorConsulta;

      setPedidos(data ?? []);
    } catch (errorConsulta) {
      console.error("Error al cargar pedidos:", errorConsulta);

      setPedidos([]);
      setError(
        "No se pudieron cargar los pedidos. Revisa la función SQL y los permisos del administrador."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const estados = useMemo(() => {
    return [
      ...new Set(
        pedidos
          .map((pedido) => pedido.estado_pedido)
          .filter(Boolean)
      ),
    ];
  }, [pedidos]);

  const pedidosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const camposBusqueda = [
        pedido.folio_pedido,
        pedido.cliente,
        pedido.rut_cliente,
        pedido.telefono_cliente,
        pedido.bodeguero,
      ];

      const coincideBusqueda =
        !termino ||
        camposBusqueda.some((campo) =>
          String(campo ?? "").toLowerCase().includes(termino)
        );

      const coincideEstado =
        estadoFiltro === "todos" ||
        pedido.estado_pedido === estadoFiltro;

      return coincideBusqueda && coincideEstado;
    });
  }, [pedidos, busqueda, estadoFiltro]);

  return (
    <section className="admin-page">
      <AdminHeader
        titulo="Pedidos"
        descripcion="Consulta los pedidos, clientes, responsables, pagos, despachos y su registro en el ERP."
      />

      <section className="admin-section">
        <div className="pedidos-admin-toolbar">
          <div>
            <h2>Gestión de pedidos</h2>
            <p>
              {pedidos.length} pedidos registrados ·{" "}
              {pedidosFiltrados.length} mostrados
            </p>
          </div>

          <button
            type="button"
            onClick={cargarPedidos}
            disabled={cargando}
          >
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div className="pedidos-admin-filtros">
          <input
            type="search"
            placeholder="Buscar por pedido, cliente, RUT o bodeguero..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar pedidos"
          />

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>

            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="pedidos-admin-error" role="alert">
            <p>{error}</p>

            <button type="button" onClick={cargarPedidos}>
              Reintentar
            </button>
          </div>
        )}

        {cargando && pedidos.length === 0 ? (
          <p>Cargando pedidos...</p>
        ) : !error && pedidosFiltrados.length === 0 ? (
          <p>No se encontraron pedidos.</p>
        ) : (
          !error && (
            <div className="pedidos-admin-tabla-contenedor">
              <table className="pedidos-admin-tabla">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Bodeguero responsable</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Despacho</th>
                    <th>ERP</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido) => (
                    <tr key={pedido.id_pedido}>
                      <td>
                        <strong>
                          {pedido.folio_pedido || "Folio pendiente"}
                        </strong>
                      </td>

                      <td>
                        {formatearFecha(pedido.fecha_pedido)}
                      </td>

                      <td>
                        <strong>
                          {pedido.cliente || "Cliente no identificado"}
                        </strong>

                        <small>
                          RUT: {pedido.rut_cliente || "Sin RUT"}
                        </small>

                        <small>
                          {pedido.telefono_cliente || "Sin teléfono"}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {pedido.bodeguero || "Sin asignar"}
                        </strong>
                      </td>

                      <td>
                        {formatearPrecio(pedido.total_pedido)}
                      </td>

                      <td>
                        <span className="pedido-admin-estado">
                          {pedido.estado_pedido || "Sin estado"}
                        </span>
                      </td>

                      <td>
                        {pedido.monto_pago == null
                          ? "Sin pago registrado"
                          : formatearPrecio(pedido.monto_pago)}
                      </td>

                      <td>
                        <strong>
                          {pedido.transportista || "Sin transportista"}
                        </strong>

                        <small>
                          {pedido.num_seguimiento || "Sin seguimiento"}
                        </small>

                        <small>
                          {pedido.comuna_despacho || "Sin comuna"}
                        </small>

                        <small>
                          {pedido.direccion_despacho || "Sin dirección"}
                        </small>
                      </td>

                      <td>
                        <span
                          className={
                            pedido.registrado_erp
                              ? "pedido-admin-erp pedido-admin-erp-ok"
                              : "pedido-admin-erp pedido-admin-erp-pendiente"
                          }
                        >
                          {pedido.registrado_erp
                            ? "Registrado"
                            : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </section>
    </section>
  );
}

export default Pedidos;
