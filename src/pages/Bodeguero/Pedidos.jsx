import { useEffect, useMemo, useState } from "react";
import {
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuEye,
  LuFileText,
  LuImageOff,
  LuInbox,
  LuMapPin,
  LuPackage,
  LuPackageCheck,
  LuPhone,
  LuReceipt,
  LuRotateCcw,
  LuSearch,
  LuStore,
  LuTriangleAlert,
  LuTruck,
  LuUser,
  LuX,
} from "react-icons/lu";
import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import {
  ESTADO_PEDIDO,
  ESTADOS_LISTOS,
  ESTADOS_PENDIENTES,
  esPedidoFinalizado,
  esPedidoListo,
  esPedidoPendiente as esPendiente,
  esRetiroTienda as esRetiro,
  obtenerDespachoPedido as obtenerDespacho,
  obtenerMensajePedidoFinalizado,
  obtenerMensajePedidoListo as obtenerMensajeCliente,
} from "../../utils/Pedidos/estadoPedido";
import "./css/pedidos-bodeguero.css";

// ==========================================================
// ESTADOS DEL PEDIDO (tabla estado_pedido)
// ==========================================================
// Estados compartidos: utils/pedidos/estadoPedido.js
const ESTADO_LISTO_DESPACHO = ESTADO_PEDIDO.LISTO_DESPACHO;
const ESTADO_LISTO_RETIRO = ESTADO_PEDIDO.LISTO_RETIRO;
const ESTADO_FINALIZADO = ESTADO_PEDIDO.FINALIZADO;
const HORAS_ATRASO = 24;

const BUCKET_IMAGENES = "imagenes_productos";

// Vistas que se activan desde los indicadores
const VISTAS = {
  pendientes: "Pendientes",
  atrasados: "Atrasados",
  retiro: "Retiro en tienda",
  despacho: "Despacho",
  listos: "Listos",
  finalizados: "Finalizados",
};

const ORDEN_PREDETERMINADO = "recientes";

// ==========================================================
// UTILIDADES
// ==========================================================
function formatearPrecio(valor) {
  return Number(valor || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
}

function formatearFechaHora(fecha) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function horasDesde(fecha) {
  if (!fecha) return 0;
  return (Date.now() - new Date(fecha).getTime()) / 36e5;
}

function textoAntiguedad(fecha) {
  const horas = horasDesde(fecha);
  if (horas < 1) return "Hace menos de 1 h";
  if (horas < 24) return `Hace ${Math.floor(horas)} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "Hace 1 día" : `Hace ${dias} días`;
}

function obtenerUrlImagen(rutaImagen) {
  if (!rutaImagen) return null;
  if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
    return rutaImagen;
  }
  const { data } = supabase.storage.from(BUCKET_IMAGENES).getPublicUrl(rutaImagen);
  return data?.publicUrl || null;
}

function esAtrasado(pedido) {
  return esPendiente(pedido) && horasDesde(pedido.fecha_predido) >= HORAS_ATRASO;
}

function obtenerIdTipoDespacho(pedido) {
  return String(obtenerDespacho(pedido)?.id_tipo_despacho ?? "");
}

// Quita tildes y pasa a minúsculas: "Peñaflor" = "penaflor"
function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Todo lo que el buscador revisa de un pedido
function textoBusquedaPedido(pedido) {
  const despacho = obtenerDespacho(pedido);
  const telefono = String(pedido.usuario?.phone_user ?? "");

  return normalizarTexto(
    [
      pedido.folio_pedido,
      pedido.id_pedido,
      pedido.usuario?.nom_user,
      telefono,
      telefono.replace(/\D/g, ""),
      despacho?.direccion_despacho,
      despacho?.comuna_despacho,
      despacho?.tipo_despacho?.nom_tipo_despacho,
      ...(pedido.detalle_pedido || []).flatMap((detalle) => [detalle.nom_prod, detalle.id_prod]),
    ].join(" "),
  );
}

function obtenerFolio(pedido) {
  return pedido?.folio_pedido || `#${pedido?.id_pedido}`;
}

function obtenerUnidades(pedido) {
  return (pedido.detalle_pedido || []).reduce(
    (total, detalle) => total + Number(detalle.cantidad || 0),
    0,
  );
}

function obtenerEstadoVisual(pedido) {
  switch (pedido.id_estado) {
    case ESTADO_FINALIZADO:
      return { texto: "Finalizado", clase: "pb-estado--finalizado" };
    case ESTADO_LISTO_RETIRO:
      return { texto: "Listo para retiro", clase: "pb-estado--listo" };
    case ESTADO_LISTO_DESPACHO:
      return { texto: "Listo para despacho", clase: "pb-estado--listo" };
    default:
      return esAtrasado(pedido)
        ? { texto: "Atrasado", clase: "pb-estado--atrasado" }
        : { texto: "Por preparar", clase: "pb-estado--pendiente" };
  }
}

function obtenerTextoBoton(pedido) {
  return esRetiro(pedido) ? "Marcar listo para retiro" : "Marcar listo para despacho";
}

// ==========================================================
// COMPONENTE
// ==========================================================
function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [vista, setVista] = useState("pendientes");
  const [busqueda, setBusqueda] = useState("");
  const [filtroDocumento, setFiltroDocumento] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroTipoDespacho, setFiltroTipoDespacho] = useState("todos");
  const [montoMinimo, setMontoMinimo] = useState("");
  const [montoMaximo, setMontoMaximo] = useState("");
  const [orden, setOrden] = useState(ORDEN_PREDETERMINADO);

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorAccion, setErrorAccion] = useState("");

  // ========================================================
  // CARGA
  // ========================================================
  useEffect(() => {
    cargarPedidos();
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = setTimeout(() => setAviso(""), 5000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  async function cargarPedidos() {
    try {
      setCargando(true);
      setError("");

      const { data, error: errorPedidos } = await supabase
        .from("pedido")
        .select(`
          id_pedido,
          folio_pedido,
          fecha_predido,
          total_pedido,
          id_estado,
          es_factura,
          usuario:id_user (
            id_user,
            nom_user,
            phone_user
          ),
          detalle_pedido (
            id_detalle,
            id_prod,
            nom_prod,
            cantidad,
            precio_unitario,
            producto:id_prod (
              imagen_url
            )
          ),
          despacho (
            id_despacho,
            direccion_despacho,
            comuna_despacho,
            costo_envio,
            requiere_coordinacion,
            id_tipo_despacho,
            tipo_despacho:id_tipo_despacho (
              nom_tipo_despacho
            )
          )
        `)
        .in("id_estado", [...ESTADOS_PENDIENTES, ...ESTADOS_LISTOS, ESTADO_FINALIZADO])
        .order("fecha_predido", { ascending: false });

      if (errorPedidos) throw errorPedidos;
      setPedidos(data || []);
    } catch (errorCarga) {
      console.error("Error al cargar pedidos:", errorCarga);
      setError(errorCarga.message || "No fue posible cargar los pedidos.");
    } finally {
      setCargando(false);
    }
  }

  // ========================================================
  // INDICADORES
  // ========================================================
  const indicadores = useMemo(() => {
    const pendientes = pedidos.filter(esPendiente);
    return {
      pendientes: pendientes.length,
      atrasados: pendientes.filter(esAtrasado).length,
      retiro: pendientes.filter(esRetiro).length,
      despacho: pendientes.filter((pedido) => !esRetiro(pedido)).length,
      listos: pedidos.filter((pedido) => ESTADOS_LISTOS.includes(pedido.id_estado)).length,
      finalizados: pedidos.filter(esPedidoFinalizado).length,
    };
  }, [pedidos]);

  // ========================================================
  // OPCIONES DE FILTROS (según los pedidos cargados)
  // ========================================================
  const opcionesTipoDespacho = useMemo(() => {
    const tipos = new Map();
    pedidos.forEach((pedido) => {
      const id = obtenerIdTipoDespacho(pedido);
      if (id) tipos.set(id, obtenerDespacho(pedido)?.tipo_despacho?.nom_tipo_despacho || `Tipo ${id}`);
    });
    return [...tipos].sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [pedidos]);

  // ========================================================
  // LISTADO FILTRADO
  // ========================================================
  const pedidosMostrar = useMemo(() => {
    const texto = normalizarTexto(busqueda.trim());

    return pedidos
      .filter((pedido) => {
        if (vista === "listos") return ESTADOS_LISTOS.includes(pedido.id_estado);
        if (vista === "finalizados") return esPedidoFinalizado(pedido);
        if (!esPendiente(pedido)) return false;
        if (vista === "atrasados") return esAtrasado(pedido);
        if (vista === "retiro") return esRetiro(pedido);
        if (vista === "despacho") return !esRetiro(pedido);
        return true;
      })
      .filter((pedido) => {
        const coincideTexto = !texto || textoBusquedaPedido(pedido).includes(texto);

        const coincideDocumento =
          filtroDocumento === "todos" ||
          (filtroDocumento === "factura" && pedido.es_factura === true) ||
          (filtroDocumento === "boleta" && pedido.es_factura !== true);

        const fecha = pedido.fecha_predido
          ? new Date(pedido.fecha_predido).toISOString().slice(0, 10)
          : "";
        const coincideDesde = !fechaDesde || (fecha && fecha >= fechaDesde);
        const coincideHasta = !fechaHasta || (fecha && fecha <= fechaHasta);

        const coincideTipo =
          filtroTipoDespacho === "todos" || obtenerIdTipoDespacho(pedido) === filtroTipoDespacho;

        const total = Number(pedido.total_pedido || 0);
        const coincideMinimo = montoMinimo === "" || total >= Number(montoMinimo);
        const coincideMaximo = montoMaximo === "" || total <= Number(montoMaximo);

        return (
          coincideTexto &&
          coincideDocumento &&
          coincideDesde &&
          coincideHasta &&
          coincideTipo &&
          coincideMinimo &&
          coincideMaximo
        );
      })
      .sort((a, b) => {
        if (orden === "recientes") return new Date(b.fecha_predido) - new Date(a.fecha_predido);
        if (orden === "mayor-monto") return Number(b.total_pedido) - Number(a.total_pedido);
        if (orden === "menor-monto") return Number(a.total_pedido) - Number(b.total_pedido);
        return new Date(a.fecha_predido) - new Date(b.fecha_predido);
      });
  }, [
    pedidos, vista, busqueda, filtroDocumento, fechaDesde, fechaHasta,
    filtroTipoDespacho, montoMinimo, montoMaximo, orden,
  ]);

  const hayFiltros = Boolean(
    busqueda ||
      filtroDocumento !== "todos" ||
      fechaDesde ||
      fechaHasta ||
      filtroTipoDespacho !== "todos" ||
      montoMinimo !== "" ||
      montoMaximo !== "" ||
      orden !== ORDEN_PREDETERMINADO,
  );

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroDocumento("todos");
    setFechaDesde("");
    setFechaHasta("");
    setFiltroTipoDespacho("todos");
    setMontoMinimo("");
    setMontoMaximo("");
    setOrden(ORDEN_PREDETERMINADO);
  }

  // ========================================================
  // DETALLE
  // ========================================================
  function abrirDetalle(pedido) {
    setPedidoSeleccionado(pedido);
    setConfirmando(false);
    setErrorAccion("");
  }

  function cerrarDetalle() {
    if (procesando) return;
    setPedidoSeleccionado(null);
    setConfirmando(false);
    setErrorAccion("");
  }

  useEffect(() => {
    if (!pedidoSeleccionado) return undefined;
    function manejarTecla(evento) {
      if (evento.key === "Escape") cerrarDetalle();
    }
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  });

  // ========================================================
  // MARCAR COMO LISTO (RPC segura)
  // ========================================================
  async function marcarComoListo() {
    if (!pedidoSeleccionado) return;

    try {
      setProcesando(true);
      setErrorAccion("");

      const { data: nuevoEstado, error: errorRpc } = await supabase.rpc(
        "marcar_pedido_listo_bodeguero",
        { p_id_pedido: pedidoSeleccionado.id_pedido },
      );

      if (errorRpc) throw errorRpc;

      const folio = obtenerFolio(pedidoSeleccionado);
      const idPedido = pedidoSeleccionado.id_pedido;

      setPedidos((actuales) =>
        actuales.map((pedido) =>
          pedido.id_pedido === idPedido
            ? { ...pedido, id_estado: Number(nuevoEstado) }
            : pedido,
        ),
      );

      setAviso(
        Number(nuevoEstado) === ESTADO_LISTO_RETIRO
          ? `Pedido ${folio} listo para retiro.`
          : `Pedido ${folio} listo para despacho.`,
      );
      setPedidoSeleccionado(null);
      setConfirmando(false);
    } catch (errorMarcar) {
      console.error("Error al marcar pedido como listo:", errorMarcar);
      setErrorAccion(errorMarcar.message || "No fue posible actualizar el pedido.");
      await cargarPedidos();
    } finally {
      setProcesando(false);
    }
  }

  // ========================================================
  // MARCAR COMO FINALIZADO (RPC segura)
  // Cliente retiró en el local o se le entregó el despacho.
  // ========================================================
  async function marcarComoFinalizado() {
    if (!pedidoSeleccionado) return;

    try {
      setProcesando(true);
      setErrorAccion("");

      const { error: errorRpc } = await supabase.rpc(
        "marcar_pedido_finalizado_bodeguero",
        { p_id_pedido: pedidoSeleccionado.id_pedido },
      );

      if (errorRpc) throw errorRpc;

      const folio = obtenerFolio(pedidoSeleccionado);
      const idPedido = pedidoSeleccionado.id_pedido;
      const retiro = esRetiro(pedidoSeleccionado);

      setPedidos((actuales) =>
        actuales.map((pedido) =>
          pedido.id_pedido === idPedido
            ? { ...pedido, id_estado: ESTADO_FINALIZADO }
            : pedido,
        ),
      );

      setAviso(
        retiro
          ? `Pedido ${folio} finalizado: retirado por el cliente.`
          : `Pedido ${folio} finalizado: entregado al cliente.`,
      );
      setPedidoSeleccionado(null);
      setConfirmando(false);
    } catch (errorFinalizar) {
      console.error("Error al finalizar pedido:", errorFinalizar);
      setErrorAccion(errorFinalizar.message || "No fue posible finalizar el pedido.");
      await cargarPedidos();
    } finally {
      setProcesando(false);
    }
  }

  // ========================================================
  // RENDER
  // ========================================================
  const tarjetasIndicadores = [
    { clave: "pendientes", valor: indicadores.pendientes, etiqueta: "Pendientes", detalle: "Pagados, por preparar", Icono: LuPackage, tono: "pendiente" },
    { clave: "atrasados", valor: indicadores.atrasados, etiqueta: "Atrasados", detalle: `Más de ${HORAS_ATRASO} h sin preparar`, Icono: LuTriangleAlert, tono: "atrasado" },
    { clave: "retiro", valor: indicadores.retiro, etiqueta: "Retiro en tienda", detalle: "Pendientes de retiro", Icono: LuStore, tono: "neutro" },
    { clave: "despacho", valor: indicadores.despacho, etiqueta: "Despacho", detalle: "Pendientes de envío", Icono: LuTruck, tono: "neutro" },
    { clave: "listos", valor: indicadores.listos, etiqueta: "Listos", detalle: "Esperando retiro o entrega", Icono: LuPackageCheck, tono: "listo" },
    { clave: "finalizados", valor: indicadores.finalizados, etiqueta: "Finalizados", detalle: "Retirados o entregados", Icono: LuCircleCheck, tono: "finalizado" },
  ];

  return (
    <div className="pedidos-bodeguero">
      <BodegueroHeader
        titulo="Pedidos"
        descripcion="Prepara los pedidos pagados y márcalos como listos."
        acciones={
          <button type="button" className="pb-boton pb-boton--secundario" onClick={cargarPedidos} disabled={cargando}>
            <LuRotateCcw aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <section className="pb-contenido">
        {/* ================= INDICADORES ================= */}
        <div className="pb-indicadores" role="tablist" aria-label="Filtrar pedidos">
          {tarjetasIndicadores.map(({ clave, valor, etiqueta, detalle, Icono, tono }) => (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={vista === clave}
              className={`pb-indicador pb-indicador--${tono}${vista === clave ? " pb-indicador--activo" : ""}`}
              onClick={() => setVista(clave)}
            >
              <span className="pb-indicador__icono">
                <Icono aria-hidden="true" />
              </span>
              <span className="pb-indicador__texto">
                <strong>{cargando ? "–" : valor}</strong>
                <span>{etiqueta}</span>
                <small>{detalle}</small>
              </span>
            </button>
          ))}
        </div>

        {/* ================= FILTROS ================= */}
        <div className="pb-filtros">
          <div className="pb-filtros__fila">
            <label className="pb-buscador">
              <LuSearch aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio, cliente, teléfono, producto, código, dirección o comuna"
                aria-label="Buscar pedidos"
              />
            </label>

            <label className="pb-campo pb-campo--orden">
              <span>Ordenar</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="recientes">Más recientes primero</option>
                <option value="antiguos">Más antiguos primero</option>
                <option value="mayor-monto">Mayor monto</option>
                <option value="menor-monto">Menor monto</option>
              </select>
            </label>
          </div>

          <div className="pb-filtros__grilla">
            <label className="pb-campo">
              <span>Tipo de despacho</span>
              <select value={filtroTipoDespacho} onChange={(e) => setFiltroTipoDespacho(e.target.value)}>
                <option value="todos">Todos</option>
                {opcionesTipoDespacho.map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </label>

            <label className="pb-campo">
              <span>Documento</span>
              <select value={filtroDocumento} onChange={(e) => setFiltroDocumento(e.target.value)}>
                <option value="todos">Boleta y factura</option>
                <option value="boleta">Solo boleta</option>
                <option value="factura">Solo factura</option>
              </select>
            </label>

            <label className="pb-campo">
              <span>Desde</span>
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </label>

            <label className="pb-campo">
              <span>Hasta</span>
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </label>

            <label className="pb-campo">
              <span>Monto mínimo</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="$0"
                value={montoMinimo}
                onChange={(e) => setMontoMinimo(e.target.value)}
              />
            </label>

            <label className="pb-campo">
              <span>Monto máximo</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Sin límite"
                value={montoMaximo}
                onChange={(e) => setMontoMaximo(e.target.value)}
              />
            </label>
          </div>

          {hayFiltros && (
            <div className="pb-filtros__pie">
              <button type="button" className="pb-boton pb-boton--texto" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        <div className="pb-resultado">
          <h2>{VISTAS[vista]}</h2>
          <span>{pedidosMostrar.length} {pedidosMostrar.length === 1 ? "pedido" : "pedidos"}</span>
        </div>

        {aviso && (
          <p className="pb-alerta pb-alerta--ok" role="status">
            <LuCircleCheck aria-hidden="true" />
            {aviso}
          </p>
        )}

        {error && (
          <p className="pb-alerta pb-alerta--error" role="alert">
            <LuTriangleAlert aria-hidden="true" />
            {error}
          </p>
        )}

        {/* ================= LISTADO ================= */}
        {cargando ? (
          <div className="pb-vacio">
            <span className="pb-spinner" aria-hidden="true" />
            <p>Cargando pedidos...</p>
          </div>
        ) : pedidosMostrar.length === 0 ? (
          <div className="pb-vacio">
            <LuInbox aria-hidden="true" />
            <p>No hay pedidos en esta vista.</p>
          </div>
        ) : (
          <ul className="pb-lista">
            {pedidosMostrar.map((pedido) => {
              const estado = obtenerEstadoVisual(pedido);
              const despacho = obtenerDespacho(pedido);
              const retiro = esRetiro(pedido);
              const atrasado = esAtrasado(pedido);
              const primerProducto = pedido.detalle_pedido?.[0];
              const imagen = obtenerUrlImagen(primerProducto?.producto?.imagen_url);
              const masProductos = (pedido.detalle_pedido?.length || 0) - 1;

              return (
                <li key={pedido.id_pedido} className={`pb-pedido${atrasado ? " pb-pedido--atrasado" : ""}`}>
                  <div className="pb-pedido__miniatura">
                    {imagen ? <img src={imagen} alt="" loading="lazy" /> : <LuPackage aria-hidden="true" />}
                  </div>

                  <div className="pb-pedido__principal">
                    <div className="pb-pedido__titulo">
                      <strong>{obtenerFolio(pedido)}</strong>
                      <span className={`pb-estado ${estado.clase}`}>{estado.texto}</span>
                    </div>
                    <p className="pb-pedido__productos">
                      {primerProducto?.nom_prod || "Sin productos"}
                      {masProductos > 0 && <span> y {masProductos} más</span>}
                    </p>
                    <p className="pb-pedido__meta">
                      <span><LuUser aria-hidden="true" />{pedido.usuario?.nom_user || "Cliente"}</span>
                      <span className={atrasado ? "pb-texto-atrasado" : ""}>
                        <LuClock aria-hidden="true" />
                        {textoAntiguedad(pedido.fecha_predido)}
                      </span>
                    </p>
                  </div>

                  <div className="pb-pedido__entrega">
                    <span className="pb-etiqueta">
                      {retiro ? <LuStore aria-hidden="true" /> : <LuTruck aria-hidden="true" />}
                      {despacho?.tipo_despacho?.nom_tipo_despacho || (retiro ? "Retiro en tienda" : "Despacho")}
                    </span>
                    {!retiro && despacho?.comuna_despacho && (
                      <small><LuMapPin aria-hidden="true" />{despacho.comuna_despacho}</small>
                    )}
                  </div>

                  <div className="pb-pedido__total">
                    <strong>{formatearPrecio(pedido.total_pedido)}</strong>
                    <small>{obtenerUnidades(pedido)} {obtenerUnidades(pedido) === 1 ? "unidad" : "unidades"}</small>
                  </div>

                  <div className="pb-pedido__acciones">
                    <button type="button" className="pb-boton pb-boton--secundario" onClick={() => abrirDetalle(pedido)}>
                      <LuEye aria-hidden="true" />
                      Ver pedido
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ================= DETALLE ================= */}
      {pedidoSeleccionado && (
        <DetallePedidoModal
          pedido={pedidoSeleccionado}
          confirmando={confirmando}
          procesando={procesando}
          errorAccion={errorAccion}
          onCerrar={cerrarDetalle}
          onPedirConfirmacion={() => setConfirmando(true)}
          onCancelarConfirmacion={() => setConfirmando(false)}
          onConfirmar={esPendiente(pedidoSeleccionado) ? marcarComoListo : marcarComoFinalizado}
        />
      )}
    </div>
  );
}

// ==========================================================
// MODAL DE DETALLE
// ==========================================================
function DetallePedidoModal({
  pedido,
  confirmando,
  procesando,
  errorAccion,
  onCerrar,
  onPedirConfirmacion,
  onCancelarConfirmacion,
  onConfirmar,
}) {
  const despacho = obtenerDespacho(pedido);
  const retiro = esRetiro(pedido);
  const pendiente = esPendiente(pedido);
  const listo = esPedidoListo(pedido);
  const finalizado = esPedidoFinalizado(pedido);

  // Acción disponible según el estado: preparar → listo → finalizado
  const accion = pendiente
    ? {
        pregunta: "¿Confirmas que el pedido está preparado?",
        mensaje: obtenerMensajeCliente(pedido),
        boton: obtenerTextoBoton(pedido),
        confirmar: "Sí, está listo",
        Icono: LuPackageCheck,
      }
    : {
        pregunta: retiro
          ? "¿Confirmas que el cliente retiró el pedido?"
          : "¿Confirmas que el pedido fue entregado al cliente?",
        mensaje: obtenerMensajePedidoFinalizado(pedido),
        boton: retiro ? "Confirmar retiro" : "Confirmar entrega",
        confirmar: "Sí, finalizar",
        Icono: LuCircleCheck,
      };
  const estado = obtenerEstadoVisual(pedido);
  const subtotal = (pedido.detalle_pedido || []).reduce(
    (total, detalle) => total + Number(detalle.cantidad || 0) * Number(detalle.precio_unitario || 0),
    0,
  );

  return (
    <div className="pb-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <section className="pb-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pb-modal-titulo">
        <header className="pb-modal__encabezado">
          <div>
            <span className="pb-modal__eyebrow">Pedido</span>
            <h2 id="pb-modal-titulo">{obtenerFolio(pedido)}</h2>
            <p>
              <LuCalendar aria-hidden="true" />
              {formatearFechaHora(pedido.fecha_predido)} · {textoAntiguedad(pedido.fecha_predido)}
            </p>
          </div>
          <div className="pb-modal__encabezado-derecha">
            <span className={`pb-estado ${estado.clase}`}>{estado.texto}</span>
            <button type="button" className="pb-icono-boton" onClick={onCerrar} aria-label="Cerrar" disabled={procesando}>
              <LuX aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="pb-modal__cuerpo">
          {/* CLIENTE Y ENTREGA */}
          <div className="pb-bloques">
            <div className="pb-bloque">
              <h3><LuUser aria-hidden="true" />Cliente</h3>
              <p className="pb-bloque__dato">{pedido.usuario?.nom_user || "Sin nombre"}</p>
              {pedido.usuario?.phone_user && (
                <a className="pb-bloque__enlace" href={`tel:${pedido.usuario.phone_user}`}>
                  <LuPhone aria-hidden="true" />
                  {pedido.usuario.phone_user}
                </a>
              )}
            </div>

            <div className="pb-bloque">
              <h3>
                {retiro ? <LuStore aria-hidden="true" /> : <LuTruck aria-hidden="true" />}
                Entrega
              </h3>
              <p className="pb-bloque__dato">
                {despacho?.tipo_despacho?.nom_tipo_despacho || (retiro ? "Retiro en tienda" : "Despacho")}
              </p>
              {retiro ? (
                <p className="pb-bloque__secundario">El cliente retira en el local de ventas.</p>
              ) : (
                <p className="pb-bloque__secundario">
                  <LuMapPin aria-hidden="true" />
                  {despacho?.direccion_despacho || "Sin dirección"}
                  {despacho?.comuna_despacho ? `, ${despacho.comuna_despacho}` : ""}
                </p>
              )}
            </div>

            <div className="pb-bloque">
              <h3>
                {pedido.es_factura ? <LuFileText aria-hidden="true" /> : <LuReceipt aria-hidden="true" />}
                Documento
              </h3>
              <p className="pb-bloque__dato">{pedido.es_factura ? "Factura" : "Boleta"}</p>
            </div>
          </div>

          {/* PRODUCTOS */}
          <h3 className="pb-subtitulo">Productos ({pedido.detalle_pedido?.length || 0})</h3>
          <ul className="pb-productos">
            {(pedido.detalle_pedido || []).map((detalle) => {
              const imagen = obtenerUrlImagen(detalle.producto?.imagen_url);
              return (
                <li key={detalle.id_detalle} className="pb-producto">
                  <div className="pb-producto__imagen">
                    {imagen ? (
                      <img src={imagen} alt={detalle.nom_prod} loading="lazy" />
                    ) : (
                      <LuImageOff aria-label="Sin imagen" />
                    )}
                  </div>
                  <div className="pb-producto__info">
                    <strong>{detalle.nom_prod}</strong>
                    <span>Código {detalle.id_prod}</span>
                  </div>
                  <div className="pb-producto__cantidad">
                    <span>Cantidad</span>
                    <strong>{detalle.cantidad}</strong>
                  </div>
                  <div className="pb-producto__precio">
                    <span>{formatearPrecio(detalle.precio_unitario)} c/u</span>
                    <strong>{formatearPrecio(Number(detalle.cantidad) * Number(detalle.precio_unitario))}</strong>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="pb-totales">
            <div><dt>Productos</dt><dd>{formatearPrecio(subtotal)}</dd></div>
            <div>
              <dt>Envío</dt>
              <dd>
                {despacho?.requiere_coordinacion
                  ? "A coordinar"
                  : Number(despacho?.costo_envio || 0) === 0
                    ? "Gratis"
                    : formatearPrecio(despacho?.costo_envio)}
              </dd>
            </div>
            <div className="pb-totales__total"><dt>Total</dt><dd>{formatearPrecio(pedido.total_pedido)}</dd></div>
          </dl>
        </div>

        {/* ACCIÓN */}
        <footer className="pb-modal__pie">
          {errorAccion && (
            <p className="pb-alerta pb-alerta--error" role="alert">
              <LuTriangleAlert aria-hidden="true" />
              {errorAccion}
            </p>
          )}

          {finalizado ? (
            <p className="pb-nota">
              <LuCircleCheck aria-hidden="true" />
              Pedido finalizado. El cliente ve: “{obtenerMensajePedidoFinalizado(pedido)}”
            </p>
          ) : confirmando ? (
            <div className="pb-confirmacion">
              <p>
                {accion.pregunta} El cliente verá:
                <em>“{accion.mensaje}”</em>
              </p>
              <div className="pb-confirmacion__botones">
                <button type="button" className="pb-boton pb-boton--secundario" onClick={onCancelarConfirmacion} disabled={procesando}>
                  Volver
                </button>
                <button type="button" className="pb-boton pb-boton--primario" onClick={onConfirmar} disabled={procesando}>
                  {procesando ? "Guardando..." : accion.confirmar}
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-modal__pie-botones">
              {listo && (
                <p className="pb-nota pb-nota--suave">
                  <LuPackageCheck aria-hidden="true" />
                  Pedido listo. El cliente ve: “{obtenerMensajeCliente(pedido)}”
                </p>
              )}
              <button type="button" className="pb-boton pb-boton--secundario" onClick={onCerrar}>
                Cerrar
              </button>
              <button type="button" className="pb-boton pb-boton--primario" onClick={onPedirConfirmacion}>
                <accion.Icono aria-hidden="true" />
                {accion.boton}
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}

export default Pedidos;