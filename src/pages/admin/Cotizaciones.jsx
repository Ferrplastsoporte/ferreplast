import { useEffect, useMemo, useState } from "react";
import {
  FiBox,
  FiCalendar,
  FiDownload,
  FiFileText,
  FiMail,
  FiPhone,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import {
  cargarCotizacionesAdmin,
  completarCotizacionAdmin,
  descargarPdfCotizacionAdmin,
  generarPdfCotizacionAdmin,
  guardarBorradorCotizacionAdmin,
  resolverResultadoCotizacionAdmin,
} from "../../services/adminCotizacionesService";
import {
  PERIODO_HISTORICO,
  crearMapaCotizabilidadCotizacion,
  crearMapaDiasValidezCotizaciones,
  crearMapaNotasCotizaciones,
  crearMapaPreciosCotizacion,
  crearPreciosParaCompletarCotizacion,
  crearPreciosParaGuardarBorrador,
  descargarArchivoDesdeUrl,
  esCantidadDiasValidezValida,
  esTasaIvaValida,
  formatearFechaCotizacion,
  formatearFechaCalendario,
  formatearFolioCotizacion,
  formatearMontoCLP,
  formatearPorcentaje,
  formatearPeriodoCotizacion,
  obtenerEstadoCotizacion,
  obtenerFechaActualChile,
  obtenerNombreProductoCotizado,
  obtenerPeriodoCotizacion,
  obtenerPeriodosDisponibles,
  obtenerTotalesCotizacion,
  normalizarConfiguracionCotizacion,
  normalizarNotasCotizacion,
  sanitizarPrecioCotizacion,
  sanitizarDiasValidez,
  sumarDiasFecha,
} from "../../utils/cotizaciones/cotizaciones";
import AdminHeader from "./components/AdminHeader";
import ModalConfirmacion from "./components/ModalConfirmacion";
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
  const [cotizabilidad, setCotizabilidad] = useState({});
  const [notasPorCotizacion, setNotasPorCotizacion] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState(() => obtenerPeriodoCotizacion());
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("recientes");
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [recarga, setRecarga] = useState(0);
  const [diasValidezPredeterminados, setDiasValidezPredeterminados] =
    useState(null);
  const [tasaIvaConfigurada, setTasaIvaConfigurada] = useState(null);
  const [diasValidezPorCotizacion, setDiasValidezPorCotizacion] = useState({});
  const [completandoCotizacion, setCompletandoCotizacion] = useState(false);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);
  const [cambiandoResultado, setCambiandoResultado] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [documentosPdf, setDocumentosPdf] = useState({});
  const [preciosModificados, setPreciosModificados] = useState({});
  const [mensajeOperacion, setMensajeOperacion] = useState(null);
  const [confirmacionResultado, setConfirmacionResultado] = useState(null);

  // ============================
  // CARGA DE COTIZACIONES Y CLIENTES
  // ============================
  useEffect(() => {
    let vigente = true;

    async function cargarCotizaciones() {
      setCargando(true);
      setMensajeError("");

      try {
        const {
          cotizaciones: nuevasCotizaciones,
          configuracion: datosConfig,
          documentos,
        } = await cargarCotizacionesAdmin();

        if (!vigente) return;

        const configuracion = normalizarConfiguracionCotizacion(datosConfig);
        if (!configuracion) {
          throw new Error(
            "La configuración de vigencia o IVA no existe o contiene un valor inválido.",
          );
        }

        const { diasValidez: diasPredeterminados, tasaIva } = configuracion;
        setCotizaciones(nuevasCotizaciones);
        setDocumentosPdf(
          Object.fromEntries(
            documentos.map((documento) => [
              String(documento.id_cotizacion),
              documento,
            ]),
          ),
        );
        setPrecios(crearMapaPreciosCotizacion(nuevasCotizaciones));
        setCotizabilidad(
          crearMapaCotizabilidadCotizacion(nuevasCotizaciones),
        );
        setNotasPorCotizacion(crearMapaNotasCotizaciones(nuevasCotizaciones));
        setPreciosModificados({});
        setDiasValidezPredeterminados(diasPredeterminados);
        setTasaIvaConfigurada(tasaIva);
        setDiasValidezPorCotizacion(
          crearMapaDiasValidezCotizaciones(
            nuevasCotizaciones,
            diasPredeterminados,
          ),
        );
        setMensajeOperacion(null);
        setCotizacionSeleccionada((actual) => {
          const actualizada = nuevasCotizaciones.find(
            (cotizacion) =>
              cotizacion.id_cotizacion === actual?.id_cotizacion,
          );
          return actualizada ?? nuevasCotizaciones[0] ?? null;
        });
      } catch (error) {
        if (!vigente) return;
        console.error("Error al cargar las cotizaciones:", error);
        setMensajeError(
          error.message || "No fue posible cargar las cotizaciones.",
        );
      } finally {
        if (vigente) setCargando(false);
      }
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
      (cotizacion) =>
        obtenerPeriodoCotizacion(cotizacion.fecha_cot) === periodo,
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
          if (estado === 4) acumulado.exitosas += 1;
          return acumulado;
        },
        {
          total: 0,
          pendientes: 0,
          completadas: 0,
          fallidas: 0,
          exitosas: 0,
        },
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
          cotizacion.usuario?.email?.toLocaleLowerCase("es").includes(termino);
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
    const finExitosas =
      ((resumen.pendientes + resumen.completadas + resumen.exitosas) /
        resumen.total) *
      100;

    return `conic-gradient(
      #f59e0b 0% ${finPendientes}%,
      #2563eb ${finPendientes}% ${finCompletadas}%,
      #22a05a ${finCompletadas}% ${finExitosas}%,
      #dc3b33 ${finExitosas}% 100%
    )`;
  }, [resumen]);

  // ============================
  // TOTALES DE LA COTIZACIÓN SELECCIONADA
  // ============================
  const tasaIvaAplicable =
    cotizacionSeleccionada?.tasa_iva_aplicada ?? tasaIvaConfigurada;

  const calculos = useMemo(() => {
    const detallesActuales = cotizacionSeleccionada?.detalle_cotizacion ?? [];

    return obtenerTotalesCotizacion(
      cotizacionSeleccionada,
      detallesActuales,
      precios,
      tasaIvaAplicable,
      cotizabilidad,
    );
  }, [cotizacionSeleccionada, precios, tasaIvaAplicable, cotizabilidad]);

  // ============================
  // EDICIÓN LOCAL DE PRECIOS
  // ============================
  function actualizarPrecio(idDetalle, valor) {
    const limpio = sanitizarPrecioCotizacion(valor);
    setPrecios((actuales) => ({ ...actuales, [idDetalle]: limpio }));
    if (cotizacionSeleccionada) {
      setPreciosModificados((actuales) => ({
        ...actuales,
        [cotizacionSeleccionada.id_cotizacion]: true,
      }));
    }
    setMensajeOperacion(null);
  }

  function actualizarCotizabilidad(idDetalle, esCotizable) {
    setCotizabilidad((actuales) => ({
      ...actuales,
      [idDetalle]: esCotizable,
    }));
    if (cotizacionSeleccionada) {
      setPreciosModificados((actuales) => ({
        ...actuales,
        [cotizacionSeleccionada.id_cotizacion]: true,
      }));
    }
    setMensajeOperacion(null);
  }

  function actualizarNotasCotizacion(valor) {
    if (!cotizacionSeleccionada) return;

    setNotasPorCotizacion((actuales) => ({
      ...actuales,
      [cotizacionSeleccionada.id_cotizacion]:
        normalizarNotasCotizacion(valor),
    }));
    setPreciosModificados((actuales) => ({
      ...actuales,
      [cotizacionSeleccionada.id_cotizacion]: true,
    }));
    setMensajeOperacion(null);
  }

  // ============================
  // VIGENCIA DE LA COTIZACIÓN
  // ============================
  function actualizarDiasValidez(valor) {
    if (!cotizacionSeleccionada) return;

    const diasLimpios = sanitizarDiasValidez(valor);
    setDiasValidezPorCotizacion((actuales) => ({
      ...actuales,
      [cotizacionSeleccionada.id_cotizacion]: diasLimpios,
    }));
    setMensajeOperacion(null);
  }

  function actualizarCotizacionLocal(idCotizacion, obtenerCambios) {
    const aplicarCambios = (cotizacion) =>
      String(cotizacion?.id_cotizacion) === String(idCotizacion)
        ? { ...cotizacion, ...obtenerCambios(cotizacion) }
        : cotizacion;

    setCotizaciones((actuales) => actuales.map(aplicarCambios));
    setCotizacionSeleccionada(aplicarCambios);
  }

  function registrarDocumentoLocal(documento) {
    if (!documento?.id_cotizacion) return;

    setDocumentosPdf((actuales) => ({
      ...actuales,
      [String(documento.id_cotizacion)]: documento,
    }));
  }

  async function guardarBorradorCotizacion() {
    if (!cotizacionSeleccionada) return;

    const preciosBorrador = crearPreciosParaGuardarBorrador(
      cotizacionSeleccionada.detalle_cotizacion,
      precios,
      cotizabilidad,
    );

    if (!preciosBorrador) {
      setMensajeOperacion({
        tipo: "error",
        texto: "Los precios ingresados deben ser números mayores que cero.",
      });
      return;
    }

    setGuardandoBorrador(true);
    setMensajeOperacion(null);

    try {
      await guardarBorradorCotizacionAdmin(
        cotizacionSeleccionada.id_cotizacion,
        preciosBorrador,
        notasPorCotizacion[cotizacionSeleccionada.id_cotizacion] ?? "",
      );
      setPreciosModificados((actuales) => ({
        ...actuales,
        [cotizacionSeleccionada.id_cotizacion]: false,
      }));
      setMensajeOperacion({
        tipo: "exito",
        texto: "Borrador guardado correctamente.",
      });
    } catch (error) {
      console.error("Error al guardar el borrador:", error);
      setMensajeOperacion({
        tipo: "error",
        texto: error.message || "No fue posible guardar el borrador.",
      });
    } finally {
      setGuardandoBorrador(false);
    }
  }

  async function completarCotizacion() {
    if (!cotizacionSeleccionada) return;

    const dias = Number(
      diasValidezPorCotizacion[cotizacionSeleccionada?.id_cotizacion],
    );
    const preciosCotizacion = crearPreciosParaCompletarCotizacion(
      cotizacionSeleccionada.detalle_cotizacion,
      precios,
      cotizabilidad,
    );

    if (!esCantidadDiasValidezValida(dias)) {
      setMensajeOperacion({
        tipo: "error",
        texto: "La vigencia debe estar entre 1 y 365 días.",
      });
      return;
    }

    if (!preciosCotizacion) {
      setMensajeOperacion({
        tipo: "error",
        texto:
          "Todos los productos disponibles deben tener un precio bruto mayor que cero.",
      });
      return;
    }

    setCompletandoCotizacion(true);
    setMensajeOperacion(null);

    try {
      const resultado = await completarCotizacionAdmin(
        cotizacionSeleccionada.id_cotizacion,
        dias,
        preciosCotizacion,
        notasPorCotizacion[cotizacionSeleccionada.id_cotizacion] ?? "",
      );

      if (!resultado) {
        throw new Error("Supabase no devolvió la cotización completada.");
      }

      actualizarCotizacionLocal(resultado.id_cotizacion, (cotizacion) => ({
        ...cotizacion,
        ...resultado,
        estado_cotizacion: {
          id_estado_cot: 2,
          nom_estado: "Completada",
        },
        notas_cotizacion:
          notasPorCotizacion[cotizacionSeleccionada.id_cotizacion]?.trim() ||
          null,
      }));
      setPreciosModificados((actuales) => ({
        ...actuales,
        [cotizacionSeleccionada.id_cotizacion]: false,
      }));

      setGenerandoPdf(true);
      try {
        const resultadoPdf = await generarPdfCotizacionAdmin(
          cotizacionSeleccionada.id_cotizacion,
        );
        registrarDocumentoLocal(resultadoPdf.documento);
        setMensajeOperacion({
          tipo: "exito",
          texto: "Cotización completada y PDF generado correctamente.",
        });
      } catch (errorPdf) {
        console.error("Error al generar el PDF:", errorPdf);
        setMensajeOperacion({
          tipo: "error",
          texto:
            "La cotización fue completada, pero el PDF no pudo generarse. Puedes reintentarlo con el botón Generar PDF.",
        });
      } finally {
        setGenerandoPdf(false);
      }
    } catch (error) {
      console.error("Error al completar la cotización:", error);
      setMensajeOperacion({
        tipo: "error",
        texto: error.message || "No fue posible completar la cotización.",
      });
    } finally {
      setCompletandoCotizacion(false);
    }
  }

  async function resolverResultadoCotizacion(idEstadoResultado) {
    if (!cotizacionSeleccionada) return;

    const nombreResultado = idEstadoResultado === 4 ? "exitosa" : "fallida";
    setCambiandoResultado(true);
    setMensajeOperacion(null);

    try {
      const resultado = await resolverResultadoCotizacionAdmin(
        cotizacionSeleccionada.id_cotizacion,
        idEstadoResultado,
      );

      if (!resultado) {
        throw new Error("Supabase no devolvió el resultado actualizado.");
      }

      const idEstado = Number(resultado.id_estado_cot);
      actualizarCotizacionLocal(resultado.id_cotizacion, () => ({
        id_estado_cot: idEstado,
        estado_cotizacion: {
          id_estado_cot: idEstado,
          nom_estado: idEstado === 4 ? "Exitosa" : "Fallida",
        },
      }));
      setMensajeOperacion({
        tipo: "exito",
        texto: `Cotización marcada como ${nombreResultado}.`,
      });
    } catch (error) {
      console.error("Error al cambiar el resultado:", error);
      setMensajeOperacion({
        tipo: "error",
        texto: error.message || "No fue posible cambiar el resultado.",
      });
    } finally {
      setCambiandoResultado(false);
      setConfirmacionResultado(null);
    }
  }

  // ============================
  // GENERACIÓN Y DESCARGA DEL PDF
  // ============================
  async function generarPdfCotizacion() {
    if (!cotizacionSeleccionada) return;

    setGenerandoPdf(true);
    setMensajeOperacion(null);

    try {
      const resultado = await generarPdfCotizacionAdmin(
        cotizacionSeleccionada.id_cotizacion,
      );
      const documento = resultado.documento;

      if (!resultado.urlDescarga) {
        throw new Error(
          "El PDF fue guardado, pero no se pudo iniciar su descarga.",
        );
      }

      descargarArchivoDesdeUrl(
        resultado.urlDescarga,
        documento.nombre_archivo,
      );
      registrarDocumentoLocal(documento);
      setMensajeOperacion({
        tipo: "exito",
        texto: "PDF generado y descargado correctamente.",
      });
    } catch (error) {
      console.error("Error al generar el PDF:", error);
      setMensajeOperacion({
        tipo: "error",
        texto: error.message || "No fue posible generar el PDF.",
      });
    } finally {
      setGenerandoPdf(false);
    }
  }

  async function descargarPdfCotizacion() {
    if (!cotizacionSeleccionada) return;

    setDescargandoPdf(true);
    setMensajeOperacion(null);

    try {
      const resultado = await descargarPdfCotizacionAdmin(
        cotizacionSeleccionada.id_cotizacion,
      );

      if (!resultado.urlDescarga) {
        throw new Error("No fue posible obtener el enlace de descarga.");
      }

      registrarDocumentoLocal(resultado.documento);
      descargarArchivoDesdeUrl(
        resultado.urlDescarga,
        resultado.documento.nombre_archivo,
      );
      setMensajeOperacion({
        tipo: "exito",
        texto: "Descarga iniciada correctamente.",
      });
    } catch (error) {
      console.error("Error al descargar el PDF:", error);
      setMensajeOperacion({
        tipo: "error",
        texto: error.message || "No fue posible descargar el PDF.",
      });
    } finally {
      setDescargandoPdf(false);
    }
  }

  // Datos derivados utilizados por el panel de detalle.
  const detalles = cotizacionSeleccionada?.detalle_cotizacion ?? [];
  const estadoSeleccionado = obtenerEstadoCotizacion(cotizacionSeleccionada);
  const IconoContacto =
    ICONOS_CONTACTO[cotizacionSeleccionada?.id_medio_cont] ?? FiPhone;
  const diasValidez =
    diasValidezPorCotizacion[cotizacionSeleccionada?.id_cotizacion] ??
    String(diasValidezPredeterminados ?? "");
  const diasValidezNumericos = Number(diasValidez);
  const vigenciaValida = esCantidadDiasValidezValida(diasValidezNumericos);
  const idEstadoSeleccionado = Number(
    cotizacionSeleccionada?.id_estado_cot,
  );
  const cotizacionPendiente = idEstadoSeleccionado === 1;
  const notasCotizacion =
    notasPorCotizacion[cotizacionSeleccionada?.id_cotizacion] ?? "";
  const puedeResolverResultado = [2, 3, 4].includes(idEstadoSeleccionado);
  const operacionEnCurso =
    completandoCotizacion ||
    guardandoBorrador ||
    cambiandoResultado ||
    generandoPdf ||
    descargandoPdf;
  const fechaEmision =
    cotizacionSeleccionada?.fecha_emision || obtenerFechaActualChile();
  const fechaValidez =
    cotizacionSeleccionada?.fecha_validez ||
    (vigenciaValida ? sumarDiasFecha(fechaEmision, diasValidezNumericos) : "");
  const preciosParaCompletar = crearPreciosParaCompletarCotizacion(
    detalles,
    precios,
    cotizabilidad,
  );
  const preciosParaBorrador = crearPreciosParaGuardarBorrador(
    detalles,
    precios,
    cotizabilidad,
  );
  const puedeGuardarBorrador =
    cotizacionPendiente &&
    Boolean(preciosParaBorrador) &&
    Boolean(preciosModificados[cotizacionSeleccionada?.id_cotizacion]) &&
    !operacionEnCurso;
  const puedeCompletar =
    cotizacionPendiente &&
    vigenciaValida &&
    esTasaIvaValida(tasaIvaAplicable) &&
    Boolean(preciosParaCompletar) &&
    !operacionEnCurso;
  const puedeGenerarPdf =
    puedeResolverResultado &&
    Boolean(cotizacionSeleccionada?.fecha_emision) &&
    !documentosPdf[String(cotizacionSeleccionada?.id_cotizacion)] &&
    !operacionEnCurso;
  const documentoPdf =
    documentosPdf[String(cotizacionSeleccionada?.id_cotizacion)] ?? null;
  const puedeDescargarPdf = Boolean(documentoPdf) && !operacionEnCurso;

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
            aria-label={`${resumen.pendientes} pendientes, ${resumen.completadas} completadas, ${resumen.exitosas} exitosas y ${resumen.fallidas} fallidas`}
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
              <span className="cotizaciones-leyenda__punto cotizaciones-leyenda__punto--exitosa" />
              <span>Exitosas</span>
              <strong>{resumen.exitosas}</strong>
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
        <div
          className="cotizaciones-mensaje cotizaciones-mensaje--error"
          role="alert"
        >
          <span>{mensajeError}</span>
          <button
            type="button"
            onClick={() => setRecarga((valor) => valor + 1)}
          >
            Reintentar
          </button>
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
          <select
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value)}
          >
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
          <select
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="1">Pendientes</option>
            <option value="2">Completadas</option>
            <option value="3">Fallidas</option>
            <option value="4">Exitosas</option>
          </select>
        </label>
        <label>
          <span>Ordenar</span>
          <select
            value={orden}
            onChange={(evento) => setOrden(evento.target.value)}
          >
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
        <div className="cotizaciones-cargando">
          Cargando solicitudes de cotización…
        </div>
      ) : cotizaciones.length === 0 && !mensajeError ? (
        <div className="cotizaciones-vacio">
          <FiFileText aria-hidden="true" />
          <strong>No hay cotizaciones registradas</strong>
          <span>Las nuevas solicitudes aparecerán en esta sección.</span>
        </div>
      ) : (
        <div className="cotizaciones-contenido">
          {/* Listado maestro de solicitudes del periodo seleccionado. */}
          <section
            className="cotizaciones-listado"
            aria-labelledby="titulo-listado-cotizaciones"
          >
            <div className="cotizaciones-panel__cabecera">
              <div>
                <span>Solicitudes</span>
                <h2 id="titulo-listado-cotizaciones">Cotizaciones recibidas</h2>
              </div>
              <strong>{cotizacionesFiltradas.length}</strong>
            </div>

            {cotizacionesFiltradas.length === 0 ? (
              <div className="cotizaciones-listado__vacio">
                No hay resultados para los filtros seleccionados.
              </div>
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
                      onClick={() => {
                        setCotizacionSeleccionada(cotizacion);
                        setMensajeOperacion(null);
                      }}
                    >
                      <span className="cotizacion-tarjeta__superior">
                        <strong>
                          {formatearFolioCotizacion(cotizacion.id_cotizacion)}
                        </strong>
                        <span
                          className={`cotizaciones-estado cotizaciones-estado--${estado.clase}`}
                        >
                          {estado.nombre}
                        </span>
                      </span>
                      <span className="cotizacion-tarjeta__cliente">
                        {cotizacion.usuario?.nom_user || "Cliente sin nombre"}
                      </span>
                      <span className="cotizacion-tarjeta__datos">
                        <span>
                          {formatearFechaCotizacion(cotizacion.fecha_cot)}
                        </span>
                        <span>
                          <FiBox aria-hidden="true" /> {cantidadProductos}{" "}
                          {cantidadProductos === 1 ? "producto" : "productos"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Panel de trabajo de la cotización seleccionada. */}
          <section
            className="cotizacion-detalle"
            aria-labelledby="titulo-detalle-cotizacion"
          >
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
                    <span className="cotizacion-detalle__etiqueta">
                      Cotización
                    </span>
                    <h2 id="titulo-detalle-cotizacion">
                      {formatearFolioCotizacion(
                        cotizacionSeleccionada.id_cotizacion,
                      )}
                    </h2>
                    <p>
                      Recibida el{" "}
                      {formatearFechaCotizacion(
                        cotizacionSeleccionada.fecha_cot,
                        true,
                      )}
                    </p>
                  </div>
                  <span
                    className={`cotizaciones-estado cotizaciones-estado--${estadoSeleccionado.clase}`}
                  >
                    {estadoSeleccionado.nombre}
                  </span>
                </header>

                {/* Datos públicos del cliente y correo obtenido desde Auth. */}
                <div className="cotizacion-cliente">
                  <div className="cotizacion-cliente__icono">
                    <FiUser aria-hidden="true" />
                  </div>
                  <div>
                    <small>Cliente</small>
                    <strong>
                      {cotizacionSeleccionada.usuario?.nom_user ||
                        "Cliente sin nombre"}
                    </strong>
                    <span>
                      {cotizacionSeleccionada.usuario?.rut_user ||
                        "RUT no informado"}
                    </span>
                    <span>
                      {cotizacionSeleccionada.usuario?.direc_user ||
                        "Dirección no informada"}
                      {cotizacionSeleccionada.usuario?.nom_comuna
                        ? `, ${cotizacionSeleccionada.usuario.nom_comuna}`
                        : ""}
                    </span>
                  </div>
                  <div>
                    <small>Contacto preferido</small>
                    <strong>
                      <IconoContacto aria-hidden="true" />{" "}
                      {cotizacionSeleccionada.medio_contacto?.nom_medio ||
                        "No informado"}
                    </strong>
                    <span>
                      {cotizacionSeleccionada.usuario?.phone_user ||
                        "Teléfono no informado"}
                    </span>
                    <span>
                      {cotizacionSeleccionada.usuario?.email ||
                        "Correo no informado"}
                    </span>
                  </div>
                </div>

                {/* Observaciones generales ingresadas por el cliente. */}
                {cotizacionSeleccionada.comentario && (
                  <div className="cotizacion-comentario">
                    <strong>Comentario del cliente</strong>
                    <p>{cotizacionSeleccionada.comentario}</p>
                  </div>
                )}

                {/* Vigencia comercial configurable antes de emitir el documento. */}
                <section
                  className="cotizacion-condiciones"
                  aria-labelledby="titulo-vigencia-cotizacion"
                >
                  <div className="cotizacion-condiciones__cabecera">
                    <div className="cotizacion-condiciones__icono">
                      <FiCalendar aria-hidden="true" />
                    </div>
                    <div>
                      <span>Condiciones comerciales</span>
                      <h3 id="titulo-vigencia-cotizacion">
                        Vigencia de la cotización
                      </h3>
                    </div>
                  </div>

                  <div className="cotizacion-condiciones__campos">
                    <div>
                      <small>Fecha de emisión</small>
                      <strong>{formatearFechaCalendario(fechaEmision)}</strong>
                      {!cotizacionSeleccionada.fecha_emision && (
                        <span>Se confirmará al completar</span>
                      )}
                    </div>

                    <label>
                      <span>Días de validez</span>
                      <div className="cotizacion-vigencia__entrada">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={diasValidez}
                          onChange={(evento) =>
                            actualizarDiasValidez(evento.target.value)
                          }
                          disabled={
                            !cotizacionPendiente || operacionEnCurso
                          }
                          aria-invalid={!vigenciaValida}
                          aria-describedby="ayuda-vigencia-cotizacion"
                        />
                        <span>días</span>
                      </div>
                    </label>

                    <div>
                      <small>Válida hasta</small>
                      <strong>
                        {vigenciaValida
                          ? formatearFechaCalendario(fechaValidez)
                          : "Revisa la cantidad de días"}
                      </strong>
                      <span id="ayuda-vigencia-cotizacion">
                        Entre 1 y 365 días corridos
                      </span>
                    </div>
                  </div>

                  {cotizacionPendiente && (
                    <p className="cotizacion-condiciones__nota">
                      La vigencia se guardará al completar la cotización.
                    </p>
                  )}
                </section>

                {/* Encabezado y cantidad de productos solicitados. */}
                <div className="cotizacion-productos__cabecera">
                  <div>
                    <span>Detalle</span>
                    <h3>Productos solicitados</h3>
                  </div>
                  <strong>
                    {detalles.length} {detalles.length === 1 ? "ítem" : "ítems"}
                  </strong>
                </div>

                {/* Productos de catálogo y solicitudes externas con precio editable. */}
                {detalles.length === 0 ? (
                  <div className="cotizaciones-listado__vacio">
                    Esta cotización no tiene productos asociados.
                  </div>
                ) : (
                  <div className="cotizacion-productos">
                    <div className="cotizacion-productos__fila cotizacion-productos__fila--encabezado">
                      <span>Producto</span>
                      <span>Cant.</span>
                      <span>Precio bruto unit.</span>
                      <span>Total bruto</span>
                    </div>
                    {detalles.map((detalle) => {
                      const esCotizable =
                        cotizabilidad[detalle.id_detalle_cot] !== false;
                      const precio =
                        Number(precios[detalle.id_detalle_cot]) || 0;
                      const subtotal = esCotizable
                        ? precio * Number(detalle.cantidad || 0)
                        : 0;
                      return (
                        <div
                          className="cotizacion-productos__fila"
                          key={detalle.id_detalle_cot}
                        >
                          <div className="cotizacion-producto">
                            <span
                              className={`cotizacion-producto__tipo ${detalle.es_producto_catalogo ? "cotizacion-producto__tipo--catalogo" : "cotizacion-producto__tipo--manual"}`}
                            >
                              {detalle.es_producto_catalogo
                                ? "Catálogo"
                                : "Solicitado"}
                            </span>
                            <strong>
                              {obtenerNombreProductoCotizado(detalle)}
                            </strong>
                            {detalle.marca_producto_solicitado && (
                              <small>
                                Marca: {detalle.marca_producto_solicitado}
                              </small>
                            )}
                            <label className="cotizacion-cotizabilidad">
                              <input
                                type="checkbox"
                                checked={esCotizable}
                                onChange={(evento) =>
                                  actualizarCotizabilidad(
                                    detalle.id_detalle_cot,
                                    evento.target.checked,
                                  )
                                }
                                disabled={
                                  !cotizacionPendiente || operacionEnCurso
                                }
                              />
                              <span>
                                {esCotizable
                                  ? "Disponible para cotizar"
                                  : "No disponible"}
                              </span>
                            </label>
                          </div>
                          <strong className="cotizacion-productos__cantidad">
                            {detalle.cantidad}
                          </strong>
                          {esCotizable ? (
                            <label className="cotizacion-precio">
                              <span aria-hidden="true">$</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={precios[detalle.id_detalle_cot] ?? ""}
                                onChange={(evento) =>
                                  actualizarPrecio(
                                    detalle.id_detalle_cot,
                                    evento.target.value,
                                  )
                                }
                                disabled={
                                  !cotizacionPendiente || operacionEnCurso
                                }
                                placeholder="0"
                                aria-label={`Precio bruto unitario de ${obtenerNombreProductoCotizado(detalle)}`}
                              />
                            </label>
                          ) : (
                            <span className="cotizacion-producto__no-disponible">
                              No disponible
                            </span>
                          )}
                          <strong className="cotizacion-productos__subtotal">
                            {esCotizable ? formatearMontoCLP(subtotal) : "—"}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notas particulares y resumen tributario de la cotización. */}
                <div className="cotizacion-cierre">
                  <label className="cotizacion-notas">
                    <span>Notas y observaciones</span>
                    <textarea
                      value={notasCotizacion}
                      onChange={(evento) =>
                        actualizarNotasCotizacion(evento.target.value)
                      }
                      placeholder="Ej: condiciones de pago, despacho o información acordada con el cliente."
                      maxLength={1000}
                      rows={5}
                      readOnly={!cotizacionPendiente}
                      disabled={operacionEnCurso}
                    />
                    <small>{notasCotizacion.length}/1000</small>
                  </label>
                  <aside
                    className="cotizacion-totales"
                    aria-label="Resumen de valores"
                  >
                    <div>
                      <span>Neto</span>
                      <strong>{formatearMontoCLP(calculos.neto)}</strong>
                    </div>
                    <div>
                      <span>
                        IVA incluido ({formatearPorcentaje(tasaIvaAplicable)}%)
                      </span>
                      <strong>{formatearMontoCLP(calculos.iva)}</strong>
                    </div>
                    <div className="cotizacion-totales__total">
                      <span>Total</span>
                      <strong>{formatearMontoCLP(calculos.totalBruto)}</strong>
                    </div>
                  </aside>
                </div>

                {/* Resultado de la operación y acciones disponibles. */}
                <footer className="cotizacion-acciones">
                  {documentoPdf ? (
                    <button
                      type="button"
                      className="cotizacion-btn cotizacion-btn--documento"
                      onClick={descargarPdfCotizacion}
                      disabled={!puedeDescargarPdf}
                    >
                      <FiDownload />
                      {descargandoPdf ? "Descargando…" : "Descargar PDF"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="cotizacion-btn cotizacion-btn--documento"
                      onClick={generarPdfCotizacion}
                      disabled={!puedeGenerarPdf}
                    >
                      <FiFileText />
                      {generandoPdf ? "Generando…" : "Generar PDF"}
                    </button>
                  )}
                  {mensajeOperacion && (
                    <p
                      className={`cotizacion-operacion__mensaje cotizacion-operacion__mensaje--${mensajeOperacion.tipo}`}
                      role={
                        mensajeOperacion.tipo === "error" ? "alert" : "status"
                      }
                    >
                      {mensajeOperacion.texto}
                    </p>
                  )}
                  <div>
                    {cotizacionPendiente && (
                      <>
                        <button
                          type="button"
                          className="cotizacion-btn cotizacion-btn--borrador"
                          onClick={guardarBorradorCotizacion}
                          disabled={!puedeGuardarBorrador}
                        >
                          {guardandoBorrador
                            ? "Guardando…"
                            : "Guardar borrador"}
                        </button>
                        <button
                          type="button"
                          className="cotizacion-btn cotizacion-btn--principal"
                          onClick={completarCotizacion}
                          disabled={!puedeCompletar}
                        >
                          {completandoCotizacion
                            ? "Completando…"
                            : "Completar cotización"}
                        </button>
                      </>
                    )}

                    {puedeResolverResultado && idEstadoSeleccionado !== 4 && (
                      <button
                        type="button"
                        className="cotizacion-btn cotizacion-btn--exitosa"
                        onClick={() =>
                          setConfirmacionResultado({
                            idEstado: 4,
                            nombre: "exitosa",
                          })
                        }
                        disabled={operacionEnCurso}
                      >
                        {cambiandoResultado
                          ? "Actualizando…"
                          : "Marcar exitosa"}
                      </button>
                    )}

                    {puedeResolverResultado && idEstadoSeleccionado !== 3 && (
                      <button
                        type="button"
                        className="cotizacion-btn cotizacion-btn--secundario"
                        onClick={() =>
                          setConfirmacionResultado({
                            idEstado: 3,
                            nombre: "fallida",
                          })
                        }
                        disabled={operacionEnCurso}
                      >
                        {cambiandoResultado
                          ? "Actualizando…"
                          : "Marcar fallida"}
                      </button>
                    )}
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      )}

      <ModalConfirmacion
        abierto={Boolean(confirmacionResultado)}
        titulo={`Marcar cotización como ${confirmacionResultado?.nombre ?? ""}`}
        mensaje={`La cotización ${formatearFolioCotizacion(cotizacionSeleccionada?.id_cotizacion)} cambiará a ${confirmacionResultado?.nombre ?? "este estado"}. Podrás corregir el resultado posteriormente.`}
        textoConfirmar={`Marcar ${confirmacionResultado?.nombre ?? ""}`}
        variante={confirmacionResultado?.idEstado === 4 ? "exito" : "peligro"}
        procesando={cambiandoResultado}
        onConfirmar={() =>
          resolverResultadoCotizacion(confirmacionResultado?.idEstado)
        }
        onCancelar={() => setConfirmacionResultado(null)}
      />
    </section>
  );
}

export default Cotizaciones;
