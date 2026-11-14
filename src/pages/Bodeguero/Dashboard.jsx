import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GraficoDashboard from "./components/GraficoDashboard";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Hourglass,
  PackageMinus,
  PackageCheck,
  PackageX,
  Phone,
  PieChart,
  Store,
  TrendingDown,
  Trophy,
  Truck,
  X,
} from "./components/IconosDashboard";

import { supabase } from "../../lib/supabase";
import BodegueroHeader from "./components/BodegueroHeader";
import BotonActualizarBodega from "./components/BotonActualizarBodega";
import {
  ENTREGAS,
  ESTADOS_GRAFICO,
  agruparDias,
  agruparHoras,
  calcularDashboard,
  contarPorEntrega,
  etiquetaDia,
  fechaCorta,
  numero,
} from "../../utils/bodega/panelBodeguero";

import "./css/bodeguero.css";
import "./css/dashboard.css";

// ---------------------------------------------------------------------
// Rutas y preferencias
// ---------------------------------------------------------------------

const RUTA_PEDIDOS = "/bodeguero/pedidos";
const RUTA_STOCK = "/bodeguero/stock";
const RANGOS = [
  { dias: 1, label: "Hoy" },
  { dias: 7, label: "7 días" },
  { dias: 14, label: "14 días" },
  { dias: 30, label: "30 días" },
];
const CLAVE_PREFERENCIAS = "ferreplast.dashboardBodeguero.v1";

const PREFERENCIAS_INICIALES = {
  dias: 14,
  visibles: { dia: true, estados: true, antiguedad: true, top: true },
  seriesDia: { retiro: true, despacho: true, coordinar: true },
  agrupacion: "dia",
  tipoDia: "bar",
  incluirFinalizados: false,
  modoTop: "mas",
  metricaTop: "unidades",
  cantidadTop: 8,
  familiaTop: "Todas",
};

const GRAFICOS = [
  { id: "dia", label: "Pedidos por día" },
  { id: "estados", label: "Estados" },
  { id: "antiguedad", label: "Antigüedad" },
  { id: "top", label: "Más / menos vendidos" },
];

const ICONO_ENTREGA = { retiro: Store, despacho: Truck, coordinar: Phone };

function leerPreferencias() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE_PREFERENCIAS) ?? "{}");
    return {
      ...PREFERENCIAS_INICIALES,
      ...guardadas,
      visibles: { ...PREFERENCIAS_INICIALES.visibles, ...guardadas.visibles },
      seriesDia: { ...PREFERENCIAS_INICIALES.seriesDia, ...guardadas.seriesDia },
    };
  } catch {
    return PREFERENCIAS_INICIALES;
  }
}

// Configuración de presentación de los gráficos locales
const EJE_CATEGORIA = {
  axisTick: { show: false },
  axisLine: { lineStyle: { color: "#cbd5e1" } },
  axisLabel: { color: "#64748b", fontSize: 11 },
};
const EJE_VALOR = {
  type: "value",
  minInterval: 1,
  splitLine: { lineStyle: { color: "#eef2f7" } },
  axisLabel: { color: "#64748b", fontSize: 11 },
};
const TOOLTIP = {
  backgroundColor: "#ffffff",
  borderColor: "#e2e8f0",
  textStyle: { color: "#0f172a", fontSize: 12 },
  extraCssText: "box-shadow: 0 10px 24px rgba(15,23,42,.12); border-radius: 10px;",
};

// ---------------------------------------------------------------------
// Componentes pequeños
// ---------------------------------------------------------------------

function FilaPop({ icono: Icono, label, valor, tono }) {
  return (
    <div className="dbb-pop__fila">
      <span>
        {Icono && <Icono size={15} aria-hidden="true" />}
        {label}
      </span>
      <strong className={tono ? `dbb-tono--${tono}` : undefined}>{valor}</strong>
    </div>
  );
}

function FilasEntrega({ conteo }) {
  return Object.entries(ENTREGAS).map(([clave, entrega]) => (
    <FilaPop
      key={clave}
      icono={ICONO_ENTREGA[clave]}
      label={entrega.label}
      valor={conteo[clave] ?? 0}
    />
  ));
}

function KpiCard({ icono: Icono, titulo, valor, detalle, tono, to, children }) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const tipoPuntero = useRef("mouse");

  function manejarClick(evento) {
    if (evento.target.closest(".dbb-pop")) return;

    // En el celular, el primer toque abre el detalle y el segundo navega
    if (tipoPuntero.current === "touch" && !abierto) {
      setAbierto(true);
      return;
    }
    navigate(to);
  }

  return (
    <div
      className={`dbb-kpi${abierto ? " is-open" : ""}`}
      tabIndex={0}
      aria-label={`${titulo}: ${valor}`}
      onPointerDown={(e) => {
        tipoPuntero.current = e.pointerType;
      }}
      onClick={manejarClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(to);
        if (e.key === "Escape") setAbierto(false);
      }}
      onMouseLeave={() => setAbierto(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
      }}
    >
      <p className="dbb-kpi__titulo">
        <Icono size={15} aria-hidden="true" />
        {titulo}
      </p>
      <p className={`dbb-kpi__valor${tono ? ` dbb-tono--${tono}` : ""}`}>{valor}</p>
      <p className={`dbb-kpi__detalle${detalle?.tono ? ` dbb-tono--${detalle.tono}` : ""}`}>
        {detalle?.texto}
      </p>

      {children && <div className="dbb-pop dbb-pop--kpi">{children}</div>}
    </div>
  );
}

// Mini ventana que aparece al hacer clic en un gráfico
function ChartPopover({ popover, onClose }) {
  const ref = useRef(null);
  const [posicion, setPosicion] = useState({ left: popover.x, top: popover.y });

  useLayoutEffect(() => {
    const el = ref.current;
    const contenedor = el?.parentElement;
    if (!el || !contenedor) return;

    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    setPosicion({
      left: Math.max(8, Math.min(popover.x, ancho - el.offsetWidth - 8)),
      top: Math.max(8, Math.min(popover.y, alto - el.offsetHeight - 8)),
    });
  }, [popover]);

  return (
    <div
      ref={ref}
      className="dbb-pop dbb-pop--chart"
      style={posicion}
      role="dialog"
      aria-label={popover.titulo}
    >
      <div className="dbb-pop__cabecera">
        <strong>{popover.titulo}</strong>
        <button type="button" className="dbb-icon-btn" onClick={onClose} aria-label="Cerrar">
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {popover.contenido}

      {popover.acciones?.map((accion) => (
        <Link key={accion.to} className="dbb-pop__accion" to={accion.to}>
          {accion.label} ↗
        </Link>
      ))}
    </div>
  );
}

function Chip({ activo, color, onClick, children }) {
  return (
    <button
      type="button"
      className={`dbb-chip${activo ? " is-active" : ""}`}
      aria-pressed={activo}
      onClick={onClick}
    >
      {color && <span className="dbb-chip__color" style={{ background: color }} />}
      {children}
    </button>
  );
}

function ChartPanel({ id, icono: Icono, titulo, controles, filtros, popover, onClosePopover, panelRef, children }) {
  return (
    <section className="dbb-panel" ref={panelRef}>
      <header className="dbb-panel__header">
        <h2>
          <Icono size={16} aria-hidden="true" />
          {titulo}
        </h2>
        {controles && <div className="dbb-panel__controles">{controles}</div>}
      </header>

      {filtros && <div className="dbb-panel__filtros">{filtros}</div>}

      {children}

      {popover?.panel === id && <ChartPopover popover={popover} onClose={onClosePopover} />}
    </section>
  );
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------

function BodegueroDashboard() {
  const navigate = useNavigate();
  const [preferencias, setPreferencias] = useState(leerPreferencias);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [actualizado, setActualizado] = useState(null);
  const [popover, setPopover] = useState(null);

  const refs = {
    dia: useRef(null),
    estados: useRef(null),
    antiguedad: useRef(null),
    top: useRef(null),
  };

  const {
    dias,
    visibles,
    seriesDia,
    agrupacion,
    tipoDia,
    incluirFinalizados,
    modoTop,
    metricaTop,
    cantidadTop,
    familiaTop,
  } = preferencias;

  function cambiar(cambios) {
    setPopover(null);
    setPreferencias((actual) => ({ ...actual, ...cambios }));
  }

  // Guarda lo que el bodeguero eligió para la próxima visita
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch {
      // Sin almacenamiento disponible: el dashboard funciona igual
    }
  }, [preferencias]);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setMensajeError("");

    const { data, error } = await supabase.rpc("reporte_dashboard_bodeguero", {
      p_dias: dias,
    });

    if (error) {
      setMensajeError("No fue posible cargar el panel de bodega.");
    } else {
      setDatos(data);
      setActualizado(new Date());
    }

    setCargando(false);
  }, [dias]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cierra la mini ventana con Escape o al hacer clic fuera
  useEffect(() => {
    if (!popover) return undefined;

    const alHacerClic = (e) => {
      if (!e.target.closest(".dbb-pop") && !e.target.closest(".dbb-chart")) setPopover(null);
    };
    const alPresionar = (e) => {
      if (e.key === "Escape") setPopover(null);
    };

    document.addEventListener("mousedown", alHacerClic);
    document.addEventListener("keydown", alPresionar);
    return () => {
      document.removeEventListener("mousedown", alHacerClic);
      document.removeEventListener("keydown", alPresionar);
    };
  }, [popover]);

  const dash = useMemo(() => calcularDashboard(datos), [datos]);

  function abrirPopover(panel, params, contenido) {
    const evento = params.event?.event;
    const rect = refs[panel].current?.getBoundingClientRect();
    if (!evento || !rect) return;

    setPopover({
      panel,
      x: evento.clientX - rect.left + 10,
      y: evento.clientY - rect.top + 10,
      ...contenido,
    });
  }

  // ---------------- Pedidos por día ----------------
  const gruposDia = useMemo(
    () =>
      dash.esHoy
        ? agruparHoras(dash.dias[0], dash.pedidosDelRango)
        : agruparDias(dash.dias, agrupacion),
    [dash.esHoy, dash.dias, dash.pedidosDelRango, agrupacion],
  );

  // Cantidad de un tipo de entrega en un grupo (una hora o uno o varios días)
  const valorGrupo = (grupo, clave) =>
    grupo.hora !== undefined
      ? dash.porHora[grupo.hora]?.[clave] ?? 0
      : grupo.dias.reduce((s, d) => s + (dash.porDia[d]?.[clave] ?? 0), 0);

  const perteneceAlGrupo = (pedido, grupo) =>
    grupo.hora !== undefined ? pedido.hora === grupo.hora : grupo.dias.includes(pedido.dia);
  const clavesDia = Object.keys(ENTREGAS).filter((k) => seriesDia[k]);

  const opcionDia = useMemo(
    () => ({
      grid: { left: 4, right: 12, top: 12, bottom: 4, containLabel: true },
      tooltip: { ...TOOLTIP, trigger: "axis" },
      xAxis: { type: "category", data: gruposDia.map((g) => g.label), ...EJE_CATEGORIA },
      yAxis: EJE_VALOR,
      series: clavesDia.map((clave, i) => ({
        name: ENTREGAS[clave].label,
        type: tipoDia,
        stack: tipoDia === "bar" ? "total" : undefined,
        smooth: true,
        symbolSize: 6,
        barMaxWidth: 24,
        emphasis: { focus: "series" },
        lineStyle: { width: 2 },
        itemStyle: {
          color: ENTREGAS[clave].color,
          borderRadius: tipoDia === "bar" && i === clavesDia.length - 1 ? [4, 4, 0, 0] : 0,
        },
        data: gruposDia.map((g) => valorGrupo(g, clave)),
      })),
    }),
    [gruposDia, clavesDia.join(), tipoDia, dash.porDia, dash.porHora],
  );

  function clicDia(params) {
    const grupo = gruposDia[params.dataIndex];
    const clave = clavesDia[params.seriesIndex];
    if (!grupo || !clave) return;

    const lista = dash.pedidosDelRango.filter(
      (p) => perteneceAlGrupo(p, grupo) && p.entrega === clave,
    );

    abrirPopover("dia", params, {
      titulo: `${ENTREGAS[clave].corto} · ${grupo.label} · ${lista.length}`,
      contenido: (
        <>
          {lista.slice(0, 5).map((p) => (
            <FilaPop
              key={p.id}
              label={`${p.folio ?? `#${p.id}`} · ${p.cliente ?? "Cliente"}`}
              valor={ESTADOS_GRAFICO.find((e) => e.id === p.estado)?.label ?? ""}
            />
          ))}
          {lista.length > 5 && <p className="dbb-pop__nota">y {lista.length - 5} pedidos más</p>}
          {lista.length === 0 && <p className="dbb-pop__nota">Sin pedidos.</p>}
        </>
      ),
      acciones: [
        {
          label: "Ver estos pedidos",
          to: `${RUTA_PEDIDOS}?filtro=todos&desde=${grupo.dias[0]}&hasta=${grupo.dias.at(-1)}&entrega=${clave}`,
        },
      ],
    });
  }

  // ---------------- Estados ----------------
  const estadosVisibles = useMemo(
    () =>
      ESTADOS_GRAFICO.filter((e) => incluirFinalizados || e.id !== 5).map((e) => ({
        ...e,
        pedidos:
          e.id === 5
            ? dash.finalizados
            : dash.pedidos.filter((p) => p.estado === e.id),
      })),
    [dash, incluirFinalizados],
  );
  const totalEstados = estadosVisibles.reduce((s, e) => s + e.pedidos.length, 0);

  const opcionEstados = useMemo(
    () => ({
      tooltip: { ...TOOLTIP, trigger: "item", formatter: "{b}: {c} ({d}%)" },
      series: [
        {
          type: "pie",
          radius: ["58%", "82%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: "center",
            formatter: () => `{n|${totalEstados}}\n{t|pedidos}`,
            rich: {
              n: { fontSize: 26, fontWeight: 800, color: "#0f172a", lineHeight: 30 },
              t: { fontSize: 12, color: "#64748b" },
            },
          },
          labelLine: { show: false },
          itemStyle: { borderColor: "#ffffff", borderWidth: 2 },
          emphasis: { scale: true, scaleSize: 6, label: { show: true } },
          data: estadosVisibles.map((e) => ({
            name: e.label,
            value: e.pedidos.length,
            itemStyle: { color: e.color },
          })),
        },
      ],
    }),
    [estadosVisibles, totalEstados],
  );

  function clicEstado(params) {
    const estado = estadosVisibles[params.dataIndex];
    if (!estado) return;

    abrirPopover("estados", params, {
      titulo: `${estado.label} · ${estado.pedidos.length}`,
      contenido: (
        <>
          <p className="dbb-pop__subtitulo">Según tipo de entrega</p>
          <FilasEntrega conteo={contarPorEntrega(estado.pedidos)} />
        </>
      ),
      acciones: [{ label: `Ver ${estado.label.toLowerCase()}`, to: `${RUTA_PEDIDOS}?filtro=${estado.filtro}` }],
    });
  }

  // ---------------- Antigüedad ----------------
  const opcionAntiguedad = useMemo(
    () => ({
      grid: { left: 4, right: 12, top: 12, bottom: 4, containLabel: true },
      tooltip: { ...TOOLTIP, trigger: "item", formatter: "{b}: {c} pedidos" },
      xAxis: { type: "category", data: dash.antiguedad.map((t) => t.label), ...EJE_CATEGORIA },
      yAxis: EJE_VALOR,
      series: [
        {
          type: "bar",
          barMaxWidth: 46,
          data: dash.antiguedad.map((t) => ({
            value: t.pedidos.length,
            itemStyle: { color: t.color, borderRadius: [4, 4, 0, 0] },
          })),
          label: { show: true, position: "top", color: "#334155", fontWeight: 700 },
        },
      ],
    }),
    [dash.antiguedad],
  );

  function clicAntiguedad(params) {
    const tramo = dash.antiguedad[params.dataIndex];
    if (!tramo) return;

    abrirPopover("antiguedad", params, {
      titulo: `${tramo.label} · ${tramo.pedidos.length} pendientes`,
      contenido: (
        <>
          <p className="dbb-pop__subtitulo">Horas hábiles desde el pago</p>
          {tramo.pedidos.slice(0, 5).map((p) => (
            <FilaPop
              key={p.id}
              icono={ICONO_ENTREGA[p.entrega]}
              label={p.folio ?? `#${p.id}`}
              valor={`${numero(p.horas_habiles)} h`}
              tono={tramo.id === "t4" ? "peligro" : undefined}
            />
          ))}
          {tramo.pedidos.length > 5 && (
            <p className="dbb-pop__nota">y {tramo.pedidos.length - 5} pedidos más</p>
          )}
          {tramo.pedidos.length === 0 && <p className="dbb-pop__nota">Sin pedidos en este tramo.</p>}
        </>
      ),
      acciones: [{ label: "Ver pendientes", to: `${RUTA_PEDIDOS}?filtro=pendientes` }],
    });
  }

  // ---------------- Más y menos vendidos ----------------
  const esMenos = modoTop === "menos";
  const fuenteTop = esMenos ? dash.menosVendidos : dash.topProductos;

  const familias = useMemo(
    () => ["Todas", ...new Set(fuenteTop.map((p) => p.familia).filter(Boolean))],
    [fuenteTop],
  );

  const topVisible = useMemo(
    () =>
      fuenteTop
        .filter((p) => familiaTop === "Todas" || p.familia === familiaTop)
        .sort((a, b) =>
          esMenos
            ? Number(a[metricaTop]) - Number(b[metricaTop]) || Number(b.stock) - Number(a.stock)
            : Number(b[metricaTop]) - Number(a[metricaTop]),
        )
        .slice(0, cantidadTop),
    [fuenteTop, esMenos, familiaTop, metricaTop, cantidadTop],
  );

  function colorBarraTop(producto) {
    if (esMenos) return Number(producto.unidades) === 0 ? "#dc2626" : "#94a3b8";
    return Number(producto.stock) <= dash.umbralCritico ? "#f59e0b" : "#2563eb";
  }

  const opcionTop = useMemo(
    () => ({
      grid: { left: 4, right: 36, top: 4, bottom: 4, containLabel: true },
      tooltip: { ...TOOLTIP, trigger: "item" },
      xAxis: { ...EJE_VALOR, min: 0 },
      yAxis: {
        type: "category",
        inverse: true,
        triggerEvent: true,
        data: topVisible.map((p) => p.nombre),
        ...EJE_CATEGORIA,
        axisLabel: {
          ...EJE_CATEGORIA.axisLabel,
          width: 130,
          overflow: "truncate",
          cursor: "pointer",
        },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 18,
          // Muestra el número al lado, así los productos con 0 ventas también se leen
          label: { show: true, position: "right", color: "#475569", fontWeight: 700 },
          data: topVisible.map((p) => ({
            value: Number(p[metricaTop]),
            itemStyle: { color: colorBarraTop(p), borderRadius: [0, 4, 4, 0] },
          })),
        },
      ],
    }),
    [topVisible, metricaTop, esMenos, dash.umbralCritico],
  );

  function clicTop(params) {
    // Clic en la barra o en el nombre del producto (útil cuando la barra es 0)
    const indice =
      params.componentType === "yAxis"
        ? topVisible.findIndex((p) => p.nombre === params.value)
        : params.dataIndex;
    const producto = topVisible[indice];
    if (!producto) return;

    if (esMenos) {
      const stock = Number(producto.stock);
      abrirPopover("top", params, {
        titulo: producto.nombre,
        contenido: (
          <>
            <FilaPop label="Vendido en el rango" valor={`${numero(producto.unidades)} u · ${producto.pedidos} pedidos`} tono={Number(producto.unidades) === 0 ? "peligro" : undefined} />
            <FilaPop label="Stock guardado" valor={`${numero(stock)} u`} />
            <FilaPop label="Última venta" valor={fechaCorta(producto.ultima_venta) ?? "Nunca"} />
            {producto.familia && <FilaPop label="Familia" valor={producto.familia} />}
          </>
        ),
        acciones: [
          { label: "Ver en stock", to: `${RUTA_STOCK}?buscar=${encodeURIComponent(producto.nombre)}` },
        ],
      });
      return;
    }

    const stock = Number(producto.stock);
    const estadoStock =
      stock <= 0
        ? { texto: "Sin stock", clase: "dbb-badge--peligro" }
        : stock <= dash.umbralCritico
          ? { texto: "Crítico", clase: "dbb-badge--alerta" }
          : { texto: "Normal", clase: "dbb-badge--ok" };

    const ultimosDias = dash.dias.slice(-14);
    const barras = ultimosDias.map((d) => Number(producto.por_dia?.[d] ?? 0));
    const maximo = Math.max(1, ...barras);

    abrirPopover("top", params, {
      titulo: producto.nombre,
      contenido: (
        <>
          <div className="dbb-pop__fila">
            <span>Stock actual</span>
            <strong>
              {numero(stock)} <span className={`dbb-badge ${estadoStock.clase}`}>{estadoStock.texto}</span>
            </strong>
          </div>
          <FilaPop label="Despachado en el rango" valor={`${numero(producto.unidades)} u · ${producto.pedidos} pedidos`} />
          <FilaPop label="En pedidos pendientes" valor={producto.en_pendientes} />
          {producto.familia && <FilaPop label="Familia" valor={producto.familia} />}

          {!dash.esHoy && (
            <>
              <p className="dbb-pop__subtitulo dbb-pop__subtitulo--espacio">Unidades por día</p>
              <div className="dbb-sparkline" aria-hidden="true">
                {barras.map((valor, i) => (
                  <span
                    key={ultimosDias[i]}
                    title={`${etiquetaDia(ultimosDias[i])}: ${valor} u`}
                    style={{ height: `${Math.max(6, (valor / maximo) * 100)}%` }}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ),
      acciones: [
        { label: "Ajustar stock", to: `${RUTA_STOCK}?buscar=${encodeURIComponent(producto.nombre)}` },
      ],
    });
  }

  // ---------------- Render ----------------
  if (cargando && !datos) {
    return (
      <section className="bodeguero-page">
        <p className="bodeguero-loading">Cargando panel...</p>
      </section>
    );
  }

  const productosAlerta = [
    ...dash.sinStock.map((p) => ({ ...p, stock: 0, tipo: "sin" })),
    ...dash.critico.map((p) => ({ ...p, tipo: "critico" })),
  ];

  return (
    <section className={`bodeguero-page dbb${cargando ? " is-loading" : ""}`}>
      <BodegueroHeader
        titulo="Panel de Bodeguero"
        descripcion="Pedidos por preparar, tiempos y stock en un solo lugar."
        acciones={
          <BotonActualizarBodega
            alActualizar={cargarDatos}
            cargando={cargando}
            etiqueta="Actualizar panel de bodega"
            titulo={actualizado ? `Actualizado a las ${actualizado.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}` : "Actualizar panel de bodega"}
          />
        }
      />

      {mensajeError && (
        <div className="bodeguero-message bodeguero-message--error" role="alert">
          <p>{mensajeError}</p>
          <button type="button" onClick={cargarDatos}>
            Reintentar
          </button>
        </div>
      )}

      {/* Barra superior: gráficos visibles y rango */}
      <div className="dbb-toolbar">
        <div className="dbb-toolbar__grupo">
          <span className="dbb-toolbar__label">Gráficos:</span>
          {GRAFICOS.map((g) => (
            <Chip
              key={g.id}
              activo={visibles[g.id]}
              onClick={() => cambiar({ visibles: { ...visibles, [g.id]: !visibles[g.id] } })}
            >
              {visibles[g.id] ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
              {g.label}
            </Chip>
          ))}
        </div>

        <div className="dbb-toolbar__grupo">
          {RANGOS.map((r) => (
            <Chip key={r.dias} activo={dias === r.dias} onClick={() => cambiar({ dias: r.dias })}>
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Tarjetas */}
      <div className="dbb-kpis">
        <KpiCard
          icono={Clock}
          titulo="Pendientes"
          valor={dash.pendientes.length}
          detalle={{ texto: "por preparar" }}
          to={`${RUTA_PEDIDOS}?filtro=pendientes`}
        >
          <p className="dbb-pop__subtitulo">Según tipo de entrega</p>
          <FilasEntrega conteo={dash.pendientesPorEntrega} />
          {dash.masAntiguo && (
            <div className="dbb-pop__separador">
              <FilaPop
                label="Más antiguo"
                valor={`${dash.masAntiguo.folio ?? `#${dash.masAntiguo.id}`} · ${numero(dash.masAntiguo.horas_espera)} h`}
              />
            </div>
          )}
          <Link className="dbb-pop__accion" to={`${RUTA_PEDIDOS}?filtro=pendientes`}>
            Ver pendientes ↗
          </Link>
        </KpiCard>

        <KpiCard
          icono={AlertTriangle}
          titulo="Atrasados 24h+"
          valor={dash.atrasados.length}
          tono={dash.atrasados.length ? "peligro" : undefined}
          detalle={{ texto: `${dash.porcentajeAtrasados}% de pendientes`, tono: dash.atrasados.length ? "peligro" : undefined }}
          to={`${RUTA_PEDIDOS}?filtro=atrasados`}
        >
          <p className="dbb-pop__subtitulo">Horas desde el pago</p>
          {dash.atrasados.slice(0, 5).map((p) => (
            <FilaPop
              key={p.id}
              icono={ICONO_ENTREGA[p.entrega]}
              label={p.folio ?? `#${p.id}`}
              valor={`${numero(p.horas_espera)} h`}
              tono="peligro"
            />
          ))}
          {dash.atrasados.length === 0 && <p className="dbb-pop__nota">No hay pedidos atrasados.</p>}
          <Link className="dbb-pop__accion" to={`${RUTA_PEDIDOS}?filtro=atrasados`}>
            Ver atrasados ↗
          </Link>
        </KpiCard>

        <KpiCard
          icono={PackageCheck}
          titulo="Listos sin entregar"
          valor={dash.listos.length}
          detalle={{ texto: "esperando al cliente" }}
          to={`${RUTA_PEDIDOS}?filtro=listos`}
        >
          <FilasEntrega conteo={dash.listosPorEntrega} />
          <Link className="dbb-pop__accion" to={`${RUTA_PEDIDOS}?filtro=listos`}>
            Ver listos ↗
          </Link>
        </KpiCard>

        <KpiCard
          icono={CheckCircle2}
          titulo={dash.esHoy ? "Finalizados (hoy)" : `Finalizados (${dias} días)`}
          valor={dash.finalizados.length}
          detalle={
            dash.variacionFinalizados === null
              ? { texto: dash.esHoy ? "pagados hoy" : "pagados en el rango" }
              : {
                  texto: `${dash.variacionFinalizados >= 0 ? "+" : ""}${dash.variacionFinalizados}% vs ${dash.esHoy ? "ayer" : "periodo anterior"}`,
                  tono: dash.variacionFinalizados >= 0 ? "ok" : "peligro",
                }
          }
          to={`${RUTA_PEDIDOS}?filtro=finalizados`}
        >
          <p className="dbb-pop__subtitulo">
            {dash.esHoy ? "Pagados hoy y ya finalizados" : "Pagados en el rango y ya finalizados"}
          </p>
          <FilasEntrega conteo={dash.finalizadosPorEntrega} />
          <Link className="dbb-pop__accion" to={`${RUTA_PEDIDOS}?filtro=finalizados`}>
            Ver finalizados ↗
          </Link>
        </KpiCard>

        <KpiCard
          icono={Boxes}
          titulo="Unidades por preparar"
          valor={numero(dash.unidadesPorPreparar)}
          detalle={{ texto: `en ${dash.pendientes.length} pedidos pendientes` }}
          to={`${RUTA_PEDIDOS}?filtro=pendientes`}
        >
          <p className="dbb-pop__subtitulo">Pedidos con más unidades</p>
          {[...dash.pendientes]
            .sort((a, b) => b.unidades - a.unidades)
            .slice(0, 4)
            .map((p) => (
              <FilaPop key={p.id} icono={ICONO_ENTREGA[p.entrega]} label={p.folio ?? `#${p.id}`} valor={`${numero(p.unidades)} u`} />
            ))}
          {dash.pendientes.length === 0 && <p className="dbb-pop__nota">No hay pedidos pendientes.</p>}
        </KpiCard>

        <KpiCard
          icono={PackageMinus}
          titulo={dash.esHoy ? "Sin ventas hoy" : `Sin ventas (${dias} días)`}
          valor={dash.sinVentasTotal}
          tono={dash.sinVentasTotal ? "alerta" : undefined}
          detalle={{ texto: "productos activos con stock" }}
          to={RUTA_STOCK}
        >
          <p className="dbb-pop__subtitulo">Con más unidades guardadas</p>
          {dash.sinVentas.slice(0, 4).map((p) => (
            <FilaPop key={p.id_prod} label={p.nombre} valor={`${numero(p.stock)} u`} />
          ))}
          {dash.sinVentasTotal > 4 && <p className="dbb-pop__nota">y {dash.sinVentasTotal - 4} productos más</p>}
          {dash.sinVentasTotal === 0 && <p className="dbb-pop__nota">Todos los productos con stock tuvieron ventas.</p>}
          <button
            type="button"
            className="dbb-pop__accion dbb-pop__accion--boton"
            onClick={() => {
              cambiar({ modoTop: "menos", visibles: { ...visibles, top: true } });
              refs.top.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            Ver menos vendidos
          </button>
        </KpiCard>

        <KpiCard
          icono={PackageX}
          titulo="Sin stock"
          valor={dash.sinStock.length}
          tono={dash.sinStock.length ? "peligro" : undefined}
          detalle={{ texto: "productos activos" }}
          to={RUTA_STOCK}
        >
          {dash.sinStock.slice(0, 3).map((p) => (
            <FilaPop
              key={p.id_prod}
              label={p.nombre}
              valor={p.en_pendientes ? `${p.en_pendientes} ${p.en_pendientes === 1 ? "pedido" : "pedidos"}` : "—"}
            />
          ))}
          {dash.sinStock.length > 3 && <p className="dbb-pop__nota">y {dash.sinStock.length - 3} productos más</p>}
          {dash.sinStock.length === 0 && <p className="dbb-pop__nota">No hay productos sin stock.</p>}
          <Link className="dbb-pop__accion" to={RUTA_STOCK}>
            Ver stock ↗
          </Link>
        </KpiCard>

        <KpiCard
          icono={TrendingDown}
          titulo="Stock crítico"
          valor={dash.critico.length}
          tono={dash.critico.length ? "alerta" : undefined}
          detalle={{ texto: `${numero(dash.umbralCritico)} unidades o menos` }}
          to={RUTA_STOCK}
        >
          {dash.critico.slice(0, 3).map((p) => (
            <FilaPop key={p.id_prod} label={p.nombre} valor={`${numero(p.stock)} u`} tono="alerta" />
          ))}
          {dash.critico.length > 3 && <p className="dbb-pop__nota">y {dash.critico.length - 3} productos más</p>}
          {dash.critico.length === 0 && <p className="dbb-pop__nota">No hay productos en stock crítico.</p>}
          <Link className="dbb-pop__accion" to={RUTA_STOCK}>
            Ver stock ↗
          </Link>
        </KpiCard>
      </div>

      {/* Gráficos */}
      <div className="dbb-graficos">
        {visibles.dia && (
          <ChartPanel
            id="dia"
            icono={BarChart3}
            titulo={dash.esHoy ? "Pedidos de hoy por hora" : "Pedidos por día"}
            panelRef={refs.dia}
            popover={popover}
            onClosePopover={() => setPopover(null)}
            controles={
              <>
                {!dash.esHoy && (
                  <select
                    className="dbb-select"
                    value={agrupacion}
                    onChange={(e) => cambiar({ agrupacion: e.target.value })}
                    aria-label="Agrupar por"
                  >
                    <option value="dia">Por día</option>
                    <option value="semana">Por semana</option>
                  </select>
                )}
                <select
                  className="dbb-select"
                  value={tipoDia}
                  onChange={(e) => cambiar({ tipoDia: e.target.value })}
                  aria-label="Tipo de gráfico"
                >
                  <option value="bar">Columnas</option>
                  <option value="line">Líneas</option>
                </select>
              </>
            }
            filtros={Object.entries(ENTREGAS).map(([clave, entrega]) => (
              <Chip
                key={clave}
                activo={seriesDia[clave]}
                color={entrega.color}
                onClick={() => {
                  const activas = Object.values(seriesDia).filter(Boolean).length;
                  if (seriesDia[clave] && activas === 1) return;
                  cambiar({ seriesDia: { ...seriesDia, [clave]: !seriesDia[clave] } });
                }}
              >
                {entrega.label}
              </Chip>
            ))}
          >
            <div className="dbb-chart">
              <GraficoDashboard option={opcionDia} style={{ height: "100%" }} onEvents={{ click: clicDia }} />
            </div>
          </ChartPanel>
        )}

        {visibles.estados && (
          <ChartPanel
            id="estados"
            icono={PieChart}
            titulo="Estado de los pedidos"
            panelRef={refs.estados}
            popover={popover}
            onClosePopover={() => setPopover(null)}
            controles={
              <Chip activo={incluirFinalizados} onClick={() => cambiar({ incluirFinalizados: !incluirFinalizados })}>
                Incluir finalizados
              </Chip>
            }
            filtros={estadosVisibles.map((e) => (
              <span key={e.id} className="dbb-leyenda">
                <span className="dbb-chip__color" style={{ background: e.color }} />
                {e.label} {e.pedidos.length}
                {totalEstados > 0 && ` (${Math.round((e.pedidos.length / totalEstados) * 100)}%)`}
              </span>
            ))}
          >
            <div className="dbb-chart">
              <GraficoDashboard option={opcionEstados} style={{ height: "100%" }} onEvents={{ click: clicEstado }} />
            </div>
          </ChartPanel>
        )}

        {visibles.antiguedad && (
          <ChartPanel
            id="antiguedad"
            icono={Hourglass}
            titulo="Antigüedad de los pendientes"
            panelRef={refs.antiguedad}
            popover={popover}
            onClosePopover={() => setPopover(null)}
            filtros={<span className="dbb-panel__nota">Horas hábiles desde el pago (lun a vie, 10:00 a 17:30)</span>}
          >
            <div className="dbb-chart">
              <GraficoDashboard option={opcionAntiguedad} style={{ height: "100%" }} onEvents={{ click: clicAntiguedad }} />
            </div>
          </ChartPanel>
        )}

        {visibles.top && (
          <ChartPanel
            id="top"
            icono={esMenos ? PackageMinus : Trophy}
            titulo={esMenos ? "Productos menos vendidos" : "Productos más vendidos"}
            panelRef={refs.top}
            popover={popover}
            onClosePopover={() => setPopover(null)}
            controles={
              <>
                <select
                  className="dbb-select"
                  value={modoTop}
                  onChange={(e) => cambiar({ modoTop: e.target.value, familiaTop: "Todas" })}
                  aria-label="Más o menos vendidos"
                >
                  <option value="mas">Más vendidos</option>
                  <option value="menos">Menos vendidos</option>
                </select>
                <select
                  className="dbb-select"
                  value={metricaTop}
                  onChange={(e) => cambiar({ metricaTop: e.target.value })}
                  aria-label="Métrica"
                >
                  <option value="unidades">Unidades</option>
                  <option value="pedidos">N° de pedidos</option>
                </select>
                <select
                  className="dbb-select"
                  value={cantidadTop}
                  onChange={(e) => cambiar({ cantidadTop: Number(e.target.value) })}
                  aria-label="Cantidad de productos"
                >
                  <option value={5}>Top 5</option>
                  <option value={8}>Top 8</option>
                  <option value={10}>Top 10</option>
                </select>
              </>
            }
            filtros={
              familias.length > 2 &&
              familias.map((familia) => (
                <Chip key={familia} activo={familiaTop === familia} onClick={() => cambiar({ familiaTop: familia })}>
                  {familia}
                </Chip>
              ))
            }
          >
            {topVisible.length > 0 ? (
              <div className="dbb-chart dbb-chart--alto">
                <GraficoDashboard option={opcionTop} style={{ height: "100%" }} onEvents={{ click: clicTop }} />
              </div>
            ) : (
              <p className="dbb-vacio">
                {esMenos ? "No hay productos activos para mostrar." : "Sin productos vendidos en este rango."}
              </p>
            )}
            {esMenos ? (
              <p className="dbb-panel__nota">
                <span className="dbb-chip__color" style={{ background: "#dc2626" }} /> Sin ventas en el rango
                <span className="dbb-chip__color" style={{ background: "#94a3b8", marginLeft: 8 }} /> Pocas ventas
              </p>
            ) : (
              <p className="dbb-panel__nota">
                <span className="dbb-chip__color" style={{ background: "#f59e0b" }} /> Stock de {numero(dash.umbralCritico)} unidades o menos
              </p>
            )}
          </ChartPanel>
        )}
      </div>

      {/* Tablas */}
      <div className="dbb-tablas dbb-tablas--una">

        <section className="dbb-panel">
          <header className="dbb-panel__header">
            <h2>
              <TrendingDown size={16} aria-hidden="true" />
              Productos para reponer
            </h2>
            <Link className="dbb-link" to={RUTA_STOCK}>
              Ver stock
            </Link>
          </header>

          {productosAlerta.length > 0 ? (
            <table className="dbb-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosAlerta.slice(0, 8).map((p) => (
                  <tr
                    key={`${p.tipo}-${p.id_prod}`}
                    tabIndex={0}
                    onClick={() => navigate(`${RUTA_STOCK}?buscar=${encodeURIComponent(p.nombre)}`)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(`${RUTA_STOCK}?buscar=${encodeURIComponent(p.nombre)}`)}
                  >
                    <td>{p.nombre}</td>
                    <td>{numero(p.stock)}</td>
                    <td>
                      <span className={`dbb-badge ${p.tipo === "sin" ? "dbb-badge--peligro" : "dbb-badge--alerta"}`}>
                        {p.tipo === "sin" ? "Sin stock" : "Crítico"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="dbb-vacio">No hay productos sin stock ni en stock crítico.</p>
          )}
        </section>
      </div>
    </section>
  );
}

export default BodegueroDashboard;