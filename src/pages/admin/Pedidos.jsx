
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FiSearch } from "react-icons/fi";
import AdminHeader from "./components/AdminHeader";
import BotonActualizarAdmin from "./components/BotonActualizarAdmin";
import "./Css/Pedidos.css";
function formatearFecha(fecha) {
  if (!fecha) return "—";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
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

function obtenerRangoPeriodo(dias = 1) {
  const hasta = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
  const [anio, mes, dia] = hasta.split("-").map(Number);
  const desde = new Date(Date.UTC(anio, mes - 1, dia - dias + 1)).toISOString().slice(0, 10);
  return { desde, hasta };
}

function Pedidos() {
  // Filtros, consulta y paginación se manejan en esta vista.
  const [filtros, setFiltros] = useState(() => ({
    ...obtenerRangoPeriodo(), busqueda: "", estado: "", especifico: "",
  }));
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [datos, setDatos] = useState(null);
  const [catalogos, setCatalogos] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const rangoValido = Boolean(filtros.desde && filtros.hasta && filtros.desde <= filtros.hasta);
  const pedidos = datos?.filas ?? [];

  useEffect(() => {
    let vigente = true;
    const controlador = new AbortController();
    setDatos(null);
    setError("");
    if (!rangoValido) {
      setCargando(false);
      return undefined;
    }
    setCargando(true);

    async function cargarPedidos() {
      try {
        const { data, error: errorConsulta } = await supabase.rpc(
          "obtener_pedidos_admin",
          {
            p_desde: filtros.desde,
            p_hasta: filtros.hasta,
            p_busqueda: filtros.busqueda.trim() || null,
            p_estado: filtros.estado === "" ? null : Number(filtros.estado),
            p_tipo_despacho: filtros.especifico === "" ? null : Number(filtros.especifico),
            p_pagina: pagina,
            p_limite: 25,
          },
        ).abortSignal(controlador.signal);
        if (errorConsulta) throw errorConsulta;
        if (!data || !Array.isArray(data.filas) || !Number.isFinite(data.total)
          || !Number.isInteger(data.pagina) || !Number.isInteger(data.paginas)) {
          throw new Error("La consulta devolvió una respuesta incompleta.");
        }
        if (!vigente) return;
        setDatos(data);
        setCatalogos(data.catalogos ?? {});
      } catch (errorConsulta) {
        if (!vigente) return;
        setError(errorConsulta.code === "PGRST202" || errorConsulta.code === "42883"
          ? "Falta actualizar obtener_pedidos_admin en Supabase con los parámetros de filtros."
          : errorConsulta.message || "No fue posible consultar los pedidos.");
      } finally {
        if (vigente) setCargando(false);
      }
    }

    const espera = setTimeout(cargarPedidos, filtros.busqueda.trim() ? 300 : 0);
    return () => {
      vigente = false;
      clearTimeout(espera);
      controlador.abort();
    };
  }, [filtros, pagina, recarga, rangoValido]);

  function cambiarFiltros(cambios) {
    setFiltros(actuales => ({ ...actuales, ...cambios }));
    setPagina(1);
  }

  function actualizar() {
    setRecarga(valor => valor + 1);
  }

  return (
    <section className="admin-page pedidos-admin-vista">
      <AdminHeader
        titulo="Pedidos"
        descripcion="Consulta los pedidos, clientes, responsables, pagos, despachos y su registro en el ERP."
      />

      <section className="admin-section" aria-busy={cargando}>
        <div className="pedidos-admin-toolbar">
          <div>
            <h2>Consulta de pedidos</h2>
            <p>{cargando ? "Consultando pedidos…" : `${datos?.total ?? 0} pedidos coinciden con los filtros · ${pedidos.length} mostrados`}</p>
          </div>
        </div>
        <section className="pedidos-consulta-filtros" aria-label="Filtros de pedidos">
          <div className="pedidos-consulta-periodos" role="group" aria-label="Período de consulta">
            {[[1, "Hoy"], [7, "Últimos 7 días"], [30, "Últimos 30 días"]].map(([dias, texto]) => {
              const rango = obtenerRangoPeriodo(dias);
              return <button key={dias} type="button" aria-pressed={filtros.desde === rango.desde && filtros.hasta === rango.hasta}
                onClick={() => cambiarFiltros(rango)}>{texto}</button>;
            })}
          </div>
          <div className="pedidos-consulta-campos">
            <label className="pedidos-consulta-busqueda">
              <span>Folio, cliente, RUT o bodeguero</span>
              <div><FiSearch aria-hidden="true" /><input type="search" placeholder="Buscar pedido…"
                value={filtros.busqueda} maxLength={100}
                onChange={evento => cambiarFiltros({ busqueda: evento.target.value })} /></div>
            </label>
            <label><span>Desde</span><input type="date" value={filtros.desde} max={filtros.hasta || undefined}
              onChange={evento => cambiarFiltros({ desde: evento.target.value })} /></label>
            <label><span>Hasta</span><input type="date" value={filtros.hasta} min={filtros.desde || undefined}
              onChange={evento => cambiarFiltros({ hasta: evento.target.value })} /></label>
            <label><span>Estado del pedido</span>
              <select value={filtros.estado} onChange={evento => cambiarFiltros({ estado: evento.target.value })}>
                <option value="">Todos los estados</option>
                {(catalogos.estados ?? []).map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
              </select>
            </label>
            <label><span>Tipo de entrega</span>
              <select value={filtros.especifico} onChange={evento => cambiarFiltros({ especifico: evento.target.value })}>
                <option value="">Todas las entregas</option>
                {(catalogos.tipos_despacho ?? []).map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
              </select>
            </label>
            <BotonActualizarAdmin alActualizar={actualizar} cargando={cargando} deshabilitado={!rangoValido} />
          </div>
          <p className="pedidos-consulta-nota">La búsqueda respeta el período seleccionado. Fecha de creación del pedido. Fechas de Chile.</p>
          {!rangoValido && <p className="pedidos-consulta-error" role="alert">Selecciona un rango válido: Desde no puede ser posterior a Hasta.</p>}
        </section>

        {error && (
          <div className="pedidos-admin-error" role="alert">
            <p>{error}</p>

            <button type="button" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <p>Cargando pedidos...</p>
        ) : !error && pedidos.length === 0 ? (
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
                  {pedidos.map((pedido) => (
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
        {datos && !cargando && rangoValido && (
          <nav className="pedidos-consulta-paginacion" aria-label="Páginas de pedidos">
            <span role="status">{datos.total ? (datos.pagina - 1) * datos.limite + 1 : 0}–{datos.total ? (datos.pagina - 1) * datos.limite + datos.filas.length : 0} de {datos.total} resultados · más recientes primero</span>
            <div>
              <button type="button" disabled={datos.pagina <= 1} onClick={() => setPagina(datos.pagina - 1)}>Anterior</button>
              <span>Página {datos.pagina} de {datos.paginas}</span>
              <button type="button" disabled={datos.pagina >= datos.paginas} onClick={() => setPagina(datos.pagina + 1)}>Siguiente</button>
            </div>
          </nav>
        )}
      </section>
    </section>
  );
}

export default Pedidos;
