import { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiDownload,
  FiFileText,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import { supabase } from "../../lib/supabase";
import { TASA_IVA } from "../../utils/comunes/impuestos";
import {
  PERIODO_HISTORICO,
  calcularTotalesCotizacion,
  crearMapaPreciosCotizacion,
  formatearFechaCotizacion,
  formatearFolioCotizacion,
  formatearMontoCLP,
  formatearPeriodoCotizacion,
  obtenerEstadoCotizacion,
  obtenerNombreProductoCotizado,
  obtenerPeriodoCotizacion,
  obtenerPeriodosDisponibles,
  sanitizarPrecioCotizacion,
} from "../../utils/cotizaciones/cotizaciones";
import AdminHeader from "./components/AdminHeader";
import "./css/Cotizaciones.css";

// ============================
// CONFIGURACIÓN DE PRESENTACIÓN
// ============================
const ICONOS_CONTACTO = { 1: FiPhone, 2: FiPhone, 3: FiMail };

function Cotizaciones() {
  // ============================
  // ESTADO DE LA VISTA
  // ============================
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [precios, setPrecios] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoCotizacion());
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("recientes");
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [recarga, setRecarga] = useState(0);

  // ============================
  // CARGA DE COTIZACIONES Y CLIENTES
  // ============================
  useEffect(() => {
    let vigente = true;

    async function cargarCotizaciones() {
      setCargando(true);
      setMensajeError("");

      const [resultadoCotizaciones, resultadoClientes] = await Promise.all([
        supabase
          .from("cotizacion")
          .select(`
            id_cotizacion,
            id_user,
            fecha_cot,
            id_medio_cont,
            comentario,
            id_estado_cot,
            medio_contacto (id_medio_cont, nom_medio),
            estado_cotizacion (id_estado_cot, nom_estado),
            detalle_cotizacion (
              id_detalle_cot,
              es_producto_catalogo,
              id_prod,
              nom_producto_solicitado,
              cantidad,
              observacion,
              valor_bruto,
              producto (id_prod, nom_prod, imagen_url)
            )
          `)
          .order("fecha_cot", { ascending: false }),
        supabase.rpc("obtener_clientes_cotizaciones_admin"),
      ]);

      if (!vigente) return;

      if (resultadoCotizaciones.error || resultadoClientes.error) {
        const error =
          resultadoCotizaciones.error || resultadoClientes.error;
        console.error("Error al cargar las cotizaciones:", {
          cotizaciones: resultadoCotizaciones.error,
          clientes: resultadoClientes.error,
        });
        setMensajeError(
          error.message || "No fue posible cargar las cotizaciones.",
        );
        setCargando(false);
        return;
      }

      const cotizacionesRecibidas = resultadoCotizaciones.data ?? [];
      const clientesPorCotizacion = new Map(
        (resultadoClientes.data ?? []).map((cliente) => [
          cliente.id_cotizacion,
          cliente,
        ]),
      );

      const nuevasCotizaciones = cotizacionesRecibidas.map((cotizacion) => ({
        ...cotizacion,
        usuario:
          clientesPorCotizacion.get(cotizacion.id_cotizacion) ?? null,
      }));

      setCotizaciones(nuevasCotizaciones);
      setPrecios(crearMapaPreciosCotizacion(nuevasCotizaciones));
      setCotizacionSeleccionada((actual) => {
        if (actual) {
          const actualizada = nuevasCotizaciones.find(
            (cotizacion) =>
              cotizacion.id_cotizacion === actual.id_cotizacion,
          );
          if (actualizada) return actualizada;
        }
        return nuevasCotizaciones[0] ?? null;
      });
      setCargando(false);
    }

    cargarCotizaciones();
    return () => {
      vigente = false;
    };
  }, [recarga]);

  // ============================
  // PERIODOS DISPONIBLES Y SELECCIONADO
  // ============================
  const periodosDisponibles = useMemo(
    () => obtenerPeriodosDisponibles(cotizaciones),
    [cotizaciones],
  );

  const cotizacionesDelPeriodo = useMemo(() => {
    if (periodo === PERIODO_HISTORICO) return cotizaciones;

    return cotizaciones.filter(
      (cotizacion) => obtenerPeriodoCotizacion(cotizacion.fecha_cot) === periodo,
    );
  }, [cotizaciones, periodo]);

  // ============================
  // RESUMEN DEL PERIODO
  // ============================
  const resumen = useMemo(
    () =>
      cotizacionesDelPeriodo.reduce(
        (acumulado, cotizacion) => {
          acumulado.total += 1;
          const estado = Number(cotizacion.id_estado_cot);
          if (estado === 1) acumulado.pendientes += 1;
          if (estado === 2) acumulado.completadas += 1;
          if (estado === 3) acumulado.fallidas += 1;
          return acumulado;
        },
        { total: 0, pendientes: 0, completadas: 0, fallidas: 0 },
      ),
    [cotizacionesDelPeriodo],
  );

  // ============================
  // BÚSQUEDA, FILTRO Y ORDENAMIENTO
  // ============================
  const cotizacionesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    return cotizacionesDelPeriodo
      .filter((cotizacion) => {
        const coincideEstado =
          filtroEstado === "todos" ||
          String(cotizacion.id_estado_cot) === filtroEstado;
        const coincideBusqueda =
          !termino ||
          String(cotizacion.id_cotizacion).includes(termino) ||
          cotizacion.usuario?.nom_user
            ?.toLocaleLowerCase("es")
            .includes(termino) ||
          cotizacion.usuario?.rut_user
            ?.toLocaleLowerCase("es")
            .includes(termino) ||
          cotizacion.usuario?.email
            ?.toLocaleLowerCase("es")
            .includes(termino);
        return coincideEstado && coincideBusqueda;
      })
      .sort((a, b) => {
        const fechaA = new Date(a.fecha_cot).getTime();
        const fechaB = new Date(b.fecha_cot).getTime();
        return orden === "antiguas" ? fechaA - fechaB : fechaB - fechaA;
      });
  }, [busqueda, cotizacionesDelPeriodo, filtroEstado, orden]);

  // ============================
  // DISTRIBUCIÓN DEL GRÁFICO DE ESTADOS
  // ============================
  const fondoGrafico = useMemo(() => {
    if (resumen.total === 0) return "#e2e8f0";

    const finPendientes = (resumen.pendientes / resumen.total) * 100;
    const finCompletadas =
      ((resumen.pendientes + resumen.completadas) / resumen.total) * 100;

    return `conic-gradient(
      #f59e0b 0% ${finPendientes}%,
      #22a05a ${finPendientes}% ${finCompletadas}%,
      #dc3b33 ${finCompletadas}% 100%
    )`;
  }, [resumen]);

  // ============================
  // TOTALES DE LA COTIZACIÓN SELECCIONADA
  // ============================
  const calculos = useMemo(() => {
    const detallesActuales =
      cotizacionSeleccionada?.detalle_cotizacion ?? [];
    return calcularTotalesCotizacion(detallesActuales, precios);
  }, [cotizacionSeleccionada, precios]);

  // ============================
  // EDICIÓN LOCAL DE PRECIOS
  // ============================
  function actualizarPrecio(idDetalle, valor) {
    const limpio = sanitizarPrecioCotizacion(valor);
    setPrecios((actuales) => ({ ...actuales, [idDetalle]: limpio }));
  }

  // Datos derivados utilizados por el panel de detalle.
  const detalles = cotizacionSeleccionada?.detalle_cotizacion ?? [];
  const estadoSeleccionado = obtenerEstadoCotizacion(cotizacionSeleccionada);
  const IconoContacto =
    ICONOS_CONTACTO[cotizacionSeleccionada?.id_medio_cont] ?? FiPhone;

  return (
    <section className="admin-page cotizaciones-page">
      {/* Encabezado principal de la página. */}
      <AdminHeader
        titulo="Cotizaciones"
        descripcion="Revisa las solicitudes, valoriza cada producto y prepara la respuesta para el cliente."
      />

      {/* Resumen del periodo mediante gráfico de dona y leyenda. */}
      <div
        className="cotizaciones-resumen"
        aria-label="Resumen de cotizaciones"
      >
        <div className="cotizaciones-resumen__cabecera">
          <span>Resumen</span>
          <h2>Estado de las cotizaciones</h2>
        </div>

        <div className="cotizaciones-resumen__contenido">
          <div
            className="cotizaciones-grafico"
            style={{ background: fondoGrafico }}
            role="img"
            aria-label={`${resumen.pendientes} pendientes, ${resumen.completadas} completadas y ${resumen.fallidas} fallidas`}
          >
            <div>
              <strong>{resumen.total}</strong>
              <span>Total</span>
            </div>
          </div>

          <ul className="cotizaciones-leyenda">
            <li>
              <span className="cotizaciones-leyenda__punto cotizaciones-leyenda__punto--pendiente" />
              <span>Pendientes</span>
              <strong>{resumen.pendientes}</strong>
            </li>
            <li>
              <span className="cotizaciones-leyenda__punto cotizaciones-leyenda__punto--completada" />
              <span>Completadas</span>
              <strong>{resumen.completadas}</strong>
            </li>
            <li>
              <span className="cotizaciones-leyenda__punto cotizaciones-leyenda__punto--fallida" />
              <span>Fallidas</span>
              <strong>{resumen.fallidas}</strong>
            </li>
          </ul>
        </div>
      </div>

      {/* Mensaje recuperable cuando falla alguna consulta. */}
      {mensajeError && (
        <div className="cotizaciones-mensaje cotizaciones-mensaje--error" role="alert">
          <span>{mensajeError}</span>
          <button type="button" onClick={() => setRecarga((valor) => valor + 1)}>Reintentar</button>
        </div>
      )}

      {/* Controles para acotar y ordenar el listado visible. */}
      <section
        className="cotizaciones-filtros"
        aria-label="Filtros de cotizaciones"
      >
        <label className="cotizaciones-busqueda">
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por folio, cliente, RUT o correo"
          />
        </label>
        <label>
          <span>Periodo</span>
          <select value={periodo} onChange={(evento) => setPeriodo(evento.target.value)}>
            {periodosDisponibles.map((periodoDisponible) => (
              <option key={periodoDisponible} value={periodoDisponible}>
                {formatearPeriodoCotizacion(periodoDisponible)}
                {periodoDisponible === obtenerPeriodoCotizacion()
                  ? " (mes actual)"
                  : ""}
              </option>
            ))}
            <option value={PERIODO_HISTORICO}>Todas las cotizaciones</option>
          </select>
        </label>

        <label>
          <span>Estado</span>
          <select value={filtroEstado} onChange={(evento) => setFiltroEstado(evento.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="1">Pendientes</option>
            <option value="2">Completadas</option>
            <option value="3">Fallidas</option>
          </select>
        </label>
        <label>
          <span>Ordenar</span>
          <select value={orden} onChange={(evento) => setOrden(evento.target.value)}>
            <option value="recientes">Más recientes</option>
            <option value="antiguas">Más antiguas</option>
          </select>
        </label>
        <button
          type="button"
          className="cotizaciones-actualizar"
          onClick={() => setRecarga((valor) => valor + 1)}
          disabled={cargando}
        >
          <FiRefreshCw aria-hidden="true" /> Actualizar
        </button>
      </section>

      {/* Estados generales de carga, lista vacía y contenido disponible. */}
      {cargando ? (
        <div className="cotizaciones-cargando">Cargando solicitudes de cotización…</div>
      ) : cotizaciones.length === 0 && !mensajeError ? (
        <div className="cotizaciones-vacio">
          <FiFileText aria-hidden="true" />
          <strong>No hay cotizaciones registradas</strong>
          <span>Las nuevas solicitudes aparecerán en esta sección.</span>
        </div>
      ) : (
        <div className="cotizaciones-contenido">
          {/* Listado maestro de solicitudes del periodo seleccionado. */}
          <section className="cotizaciones-listado" aria-labelledby="titulo-listado-cotizaciones">
            <div className="cotizaciones-panel__cabecera">
              <div>
                <span>Solicitudes</span>
                <h2 id="titulo-listado-cotizaciones">Cotizaciones recibidas</h2>
              </div>
              <strong>{cotizacionesFiltradas.length}</strong>
            </div>

            {cotizacionesFiltradas.length === 0 ? (
              <div className="cotizaciones-listado__vacio">No hay resultados para los filtros seleccionados.</div>
            ) : (
              <div className="cotizaciones-listado__items">
                {cotizacionesFiltradas.map((cotizacion) => {
                  const estado = obtenerEstadoCotizacion(cotizacion);
                  const seleccionada =
                    cotizacionSeleccionada?.id_cotizacion ===
                    cotizacion.id_cotizacion;
                  const cantidadProductos =
                    cotizacion.detalle_cotizacion?.length ?? 0;
                  return (
                    <button
                      type="button"
                      key={cotizacion.id_cotizacion}
                      className={`cotizacion-tarjeta ${seleccionada ? "is-selected" : ""}`}
                      onClick={() => setCotizacionSeleccionada(cotizacion)}
                    >
                      <span className="cotizacion-tarjeta__superior">
                        <strong>{formatearFolioCotizacion(cotizacion.id_cotizacion)}</strong>
                        <span className={`cotizaciones-estado cotizaciones-estado--${estado.clase}`}>{estado.nombre}</span>
                      </span>
                      <span className="cotizacion-tarjeta__cliente">{cotizacion.usuario?.nom_user || "Cliente sin nombre"}</span>
                      <span className="cotizacion-tarjeta__datos">
                        <span>{formatearFechaCotizacion(cotizacion.fecha_cot)}</span>
                        <span><FiBox aria-hidden="true" /> {cantidadProductos} {cantidadProductos === 1 ? "producto" : "productos"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Panel de trabajo de la cotización seleccionada. */}
          <section className="cotizacion-detalle" aria-labelledby="titulo-detalle-cotizacion">
            {!cotizacionSeleccionada ? (
              <div className="cotizaciones-vacio cotizaciones-vacio--detalle">
                <FiFileText aria-hidden="true" />
                <strong>Selecciona una cotización</strong>
                <span>El detalle de la solicitud aparecerá aquí.</span>
              </div>
            ) : (
              <>
                {/* Identificación, fecha y estado de la solicitud. */}
                <header className="cotizacion-detalle__cabecera">
                  <div>
                    <span className="cotizacion-detalle__etiqueta">Cotización</span>
                    <h2 id="titulo-detalle-cotizacion">{formatearFolioCotizacion(cotizacionSeleccionada.id_cotizacion)}</h2>
                    <p>Recibida el {formatearFechaCotizacion(cotizacionSeleccionada.fecha_cot, true)}</p>
                  </div>
                  <span className={`cotizaciones-estado cotizaciones-estado--${estadoSeleccionado.clase}`}>{estadoSeleccionado.nombre}</span>
                </header>

                {/* Datos públicos del cliente y correo obtenido desde Auth. */}
                <div className="cotizacion-cliente">
                  <div className="cotizacion-cliente__icono"><FiUser aria-hidden="true" /></div>
                  <div>
                    <small>Cliente</small>
                    <strong>{cotizacionSeleccionada.usuario?.nom_user || "Cliente sin nombre"}</strong>
                    <span>{cotizacionSeleccionada.usuario?.rut_user || "RUT no informado"}</span>
                    <span>
                      {cotizacionSeleccionada.usuario?.direc_user || "Dirección no informada"}
                      {cotizacionSeleccionada.usuario?.nom_comuna
                        ? `, ${cotizacionSeleccionada.usuario.nom_comuna}`
                        : ""}
                    </span>
                  </div>
                  <div>
                    <small>Contacto preferido</small>
                    <strong><IconoContacto aria-hidden="true" /> {cotizacionSeleccionada.medio_contacto?.nom_medio || "No informado"}</strong>
                    <span>{cotizacionSeleccionada.usuario?.phone_user || "Teléfono no informado"}</span>
                    <span>{cotizacionSeleccionada.usuario?.email || "Correo no informado"}</span>
                  </div>
                </div>

                {/* Observaciones generales ingresadas por el cliente. */}
                {cotizacionSeleccionada.comentario && (
                  <div className="cotizacion-comentario">
                    <strong>Comentario del cliente</strong>
                    <p>{cotizacionSeleccionada.comentario}</p>
                  </div>
                )}

                {/* Encabezado y cantidad de productos solicitados. */}
                <div className="cotizacion-productos__cabecera">
                  <div><span>Detalle</span><h3>Productos solicitados</h3></div>
                  <strong>{detalles.length} {detalles.length === 1 ? "ítem" : "ítems"}</strong>
                </div>

                {/* Productos de catálogo y solicitudes externas con precio editable. */}
                {detalles.length === 0 ? (
                  <div className="cotizaciones-listado__vacio">Esta cotización no tiene productos asociados.</div>
                ) : (
                  <div className="cotizacion-productos">
                    <div className="cotizacion-productos__fila cotizacion-productos__fila--encabezado">
                      <span>Producto</span><span>Cant.</span><span>Precio neto unit.</span><span>Subtotal</span>
                    </div>
                    {detalles.map((detalle) => {
                      const precio =
                        Number(precios[detalle.id_detalle_cot]) || 0;
                      const subtotal =
                        precio * Number(detalle.cantidad || 0);
                      return (
                        <div className="cotizacion-productos__fila" key={detalle.id_detalle_cot}>
                          <div className="cotizacion-producto">
                            <span className={`cotizacion-producto__tipo ${detalle.es_producto_catalogo ? "cotizacion-producto__tipo--catalogo" : "cotizacion-producto__tipo--manual"}`}>
                              {detalle.es_producto_catalogo ? "Catálogo" : "Solicitado"}
                            </span>
                            <strong>{obtenerNombreProductoCotizado(detalle)}</strong>
                            {detalle.observacion && <small>{detalle.observacion}</small>}
                          </div>
                          <strong className="cotizacion-productos__cantidad">{detalle.cantidad}</strong>
                          <label className="cotizacion-precio">
                            <span aria-hidden="true">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={precios[detalle.id_detalle_cot] ?? ""}
                              onChange={(evento) => actualizarPrecio(detalle.id_detalle_cot, evento.target.value)}
                              placeholder="0"
                              aria-label={`Precio neto unitario de ${obtenerNombreProductoCotizado(detalle)}`}
                            />
                          </label>
                          <strong className="cotizacion-productos__subtotal">{formatearMontoCLP(subtotal)}</strong>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Exportaciones futuras y resumen tributario de la cotización. */}
                <div className="cotizacion-cierre">
                  <div className="cotizacion-documentos">
                    <h3>Documentos de la cotización</h3>
                    <div>
                      <button type="button" disabled><FiFileText /> Generar PDF</button>
                      <button type="button" disabled><FiDownload /> Exportar Excel</button>
                    </div>
                  </div>
                  <aside className="cotizacion-totales" aria-label="Resumen de valores">
                    <div><span>Subtotal neto</span><strong>{formatearMontoCLP(calculos.subtotal)}</strong></div>
                    <div><span>IVA ({TASA_IVA * 100}%)</span><strong>{formatearMontoCLP(calculos.iva)}</strong></div>
                    <div className="cotizacion-totales__total"><span>Total</span><strong>{formatearMontoCLP(calculos.total)}</strong></div>
                  </aside>
                </div>

                {/* Acciones reservadas para la etapa de persistencia. */}
                <footer className="cotizacion-acciones">
                  <div>
                    <button type="button" className="cotizacion-btn cotizacion-btn--secundario" disabled>Marcar fallida</button>
                    <button type="button" className="cotizacion-btn cotizacion-btn--guardar" disabled>Guardar precios</button>
                    <button type="button" className="cotizacion-btn cotizacion-btn--principal" disabled>Completar cotización</button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default Cotizaciones;
