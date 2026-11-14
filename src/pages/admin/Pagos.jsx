
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FiSearch } from "react-icons/fi";
import AdminHeader from "./components/AdminHeader";
import BotonActualizarAdmin from "./components/BotonActualizarAdmin";
import "./Css/Pagos.css";

const formatoCLP = (monto) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(monto) || 0);

const formatoFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return valor.toLocaleString("es-CL", {
    timeZone: "America/Santiago",
    dateStyle: "short",
    timeStyle: "short",
  });
};

const normalizarEstado = (estado) =>
  String(estado ?? "").trim().toUpperCase();

const obtenerClaseEstado = (estado) => {
  const codigo = normalizarEstado(estado);

  if (codigo === "AUTORIZADO") {
    return "pago-estado--exito";
  }

  if (
    codigo === "RECHAZADO" ||
    codigo === "ERROR_CONFIRMACION"
  ) {
    return "pago-estado--error";
  }

  if (
    [
      "ANULADO",
      "REVERSADO",
      "ABORTADO",
      "EXPIRADO",
    ].includes(codigo)
  ) {
    return "pago-estado--inactivo";
  }

  return "pago-estado--pendiente";
};

const obtenerDetalleProveedor = (datos) => {
  if (!datos || typeof datos !== "object") {
    return {};
  }

  const respuesta = datos.respuesta ?? datos;
  const primerPago = Array.isArray(respuesta.payment)
    ? respuesta.payment[0]
    : null;

  const estadoGeneral =
    respuesta.status ??
    primerPago?.status ??
    datos.status;

  return {
    proveedor: datos.proveedor ?? "No informado",
    estado:
      estadoGeneral?.status ??
      datos.estado_transbank ??
      "Sin información",
    mensaje:
      estadoGeneral?.message ??
      datos.message ??
      "El proveedor no entregó un mensaje.",
    referencia:
      primerPago?.reference ??
      datos.reference ??
      datos.buy_order ??
      "No disponible",
    metodo:
      primerPago?.paymentMethodName ??
      primerPago?.paymentMethod ??
      (datos.proveedor === "WEBPAY" ? "Webpay" : "No disponible"),
    comprobante:
      primerPago?.receipt ??
      datos.receipt ??
      "No disponible",
    autorizacion:
      primerPago?.authorization ??
      datos.authorization_code ??
      "No disponible",
    fecha: estadoGeneral?.date ?? datos.date ?? null,
    codigoRespuesta:
      datos.response_code ?? datos.reason ?? "No disponible",
    ultimosDigitos: datos.card_last4 ?? "No disponible",
  };
};

function obtenerRangoPeriodo(dias = 1) {
  const hasta = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Santiago" });
  const [anio, mes, dia] = hasta.split("-").map(Number);
  const desde = new Date(Date.UTC(anio, mes - 1, dia - dias + 1)).toISOString().slice(0, 10);
  return { desde, hasta };
}

function Pagos() {
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
  const pagos = datos?.filas ?? [];
  const resumen = datos?.resumen ?? { cantidad: 0, autorizados: 0, montoAutorizado: 0 };
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);

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

    async function cargarPagos() {
      try {
        const { data, error: errorConsulta } = await supabase.rpc(
          "admin_listar_pagos",
          {
            p_desde: filtros.desde,
            p_hasta: filtros.hasta,
            p_busqueda: filtros.busqueda.trim() || null,
            p_estado: filtros.estado === "" ? null : filtros.estado,
            p_metodo_pago: filtros.especifico === "" ? null : Number(filtros.especifico),
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
          ? "Falta actualizar admin_listar_pagos en Supabase con los parámetros de filtros."
          : errorConsulta.message || "No fue posible consultar los pagos.");
      } finally {
        if (vigente) setCargando(false);
      }
    }

    const espera = setTimeout(cargarPagos, filtros.busqueda.trim() ? 300 : 0);
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

  const abrirDetalle = (pago) => {
    setPagoSeleccionado(pago);
  };

  return (
    <section className="admin-page pagos-page">
      <AdminHeader
        titulo="Pagos"
        descripcion="Consulta los pagos asociados a los pedidos realizados en la plataforma."
      />

      <section className="admin-section pagos-contenido" aria-busy={cargando}>
        <section className="pagos-consulta-filtros" aria-label="Filtros de pagos">
          <div className="pagos-consulta-periodos" role="group" aria-label="Período de consulta">
            {[[1, "Hoy"], [7, "Últimos 7 días"], [30, "Últimos 30 días"]].map(([dias, texto]) => {
              const rango = obtenerRangoPeriodo(dias);
              return <button key={dias} type="button" aria-pressed={filtros.desde === rango.desde && filtros.hasta === rango.hasta}
                onClick={() => cambiarFiltros(rango)}>{texto}</button>;
            })}
          </div>
          <div className="pagos-consulta-campos">
            <label className="pagos-consulta-busqueda">
              <span>Folio, referencia, cliente o RUT</span>
              <div><FiSearch aria-hidden="true" /><input type="search" placeholder="Buscar pago…"
                value={filtros.busqueda} maxLength={100}
                onChange={evento => cambiarFiltros({ busqueda: evento.target.value })} /></div>
            </label>
            <label><span>Desde</span><input type="date" value={filtros.desde} max={filtros.hasta || undefined}
              onChange={evento => cambiarFiltros({ desde: evento.target.value })} /></label>
            <label><span>Hasta</span><input type="date" value={filtros.hasta} min={filtros.desde || undefined}
              onChange={evento => cambiarFiltros({ hasta: evento.target.value })} /></label>
            <label><span>Estado del pago</span>
              <select value={filtros.estado} onChange={evento => cambiarFiltros({ estado: evento.target.value })}>
                <option value="">Todos los estados</option>
                {(catalogos.estados ?? []).map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
              </select>
            </label>
            <label><span>Método de pago</span>
              <select value={filtros.especifico} onChange={evento => cambiarFiltros({ especifico: evento.target.value })}>
                <option value="">Todos los métodos</option>
                {(catalogos.metodos_pago ?? []).map(opcion => <option key={opcion.id} value={opcion.id}>{opcion.nombre}</option>)}
              </select>
            </label>
            <BotonActualizarAdmin alActualizar={actualizar} cargando={cargando} deshabilitado={!rangoValido} />
          </div>
          <p className="pagos-consulta-nota">La búsqueda respeta el período seleccionado. Fecha de pago; si aún no existe, se usa la de creación. Fechas de Chile.</p>
          {!rangoValido && <p className="pagos-consulta-error" role="alert">Selecciona un rango válido: Desde no puede ser posterior a Hasta.</p>}
        </section>
        <div className="pagos-resumen">
          <article className="pagos-resumen-card">
            <span>Pagos con folio</span>
            <strong>{datos ? resumen.cantidad : "—"}</strong>
          </article>

          <article className="pagos-resumen-card">
            <span>Pagos autorizados</span>
            <strong>{datos ? resumen.autorizados : "—"}</strong>
          </article>

          <article className="pagos-resumen-card">
            <span>Monto autorizado</span>
            <strong>{datos ? formatoCLP(resumen.montoAutorizado) : "—"}</strong>
          </article>
        </div>

        {error && (
          <div className="pagos-mensaje pagos-mensaje--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={actualizar}>
              Reintentar
            </button>
          </div>
        )}

        <div className="pagos-tabla-contenedor">
          <table className="pagos-tabla">
            <thead>
              <tr>
                <th>Folio de pago</th>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={7} className="pagos-tabla-vacio">
                    Cargando pagos...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="pagos-tabla-vacio">
                    No se pudieron cargar los pagos.
                  </td>
                </tr>
              ) : pagos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pagos-tabla-vacio">
                    No se encontraron pagos para esta búsqueda.
                  </td>
                </tr>
              ) : (
                pagos.map((pago) => (
                  <tr key={pago.id_pago}>
                    <td>
                      <strong className="pagos-folio">
                        {pago.folio_pago}
                      </strong>
                    </td>

                    <td>{pago.folio_pedido || "Sin pedido"}</td>
                    <td>{pago.cliente || "Sin cliente"}</td>

                    <td className="pagos-monto">
                      {formatoCLP(pago.monto)}
                    </td>

                    <td>
                      {formatoFecha(
                        pago.fecha_pago || pago.fecha_creacion
                      )}
                    </td>

                    <td>
                      <span
                        className={`pago-estado ${obtenerClaseEstado(
                          pago.estado_codigo
                        )}`}
                      >
                        {pago.estado_nombre || pago.estado_codigo}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="pagos-boton-detalle"
                        onClick={() => abrirDetalle(pago)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {datos && !cargando && rangoValido && (
          <nav className="pagos-consulta-paginacion" aria-label="Páginas de pagos">
            <span role="status">{datos.total ? (datos.pagina - 1) * datos.limite + 1 : 0}–{datos.total ? (datos.pagina - 1) * datos.limite + datos.filas.length : 0} de {datos.total} resultados · más recientes primero</span>
            <div>
              <button type="button" disabled={datos.pagina <= 1} onClick={() => setPagina(datos.pagina - 1)}>Anterior</button>
              <span>Página {datos.pagina} de {datos.paginas}</span>
              <button type="button" disabled={datos.pagina >= datos.paginas} onClick={() => setPagina(datos.pagina + 1)}>Siguiente</button>
            </div>
          </nav>
        )}
        
      </section>

      {pagoSeleccionado && (
        <div
          className="pagos-modal-fondo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPagoSeleccionado(null);
            }
          }}
        >
          <section
            className="pagos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-pago-titulo"
          >
            <header className="pagos-modal-header">
              <div>
                <span>Detalle de transacción</span>
                <h2 id="detalle-pago-titulo">
                  {pagoSeleccionado.folio_pago}
                </h2>
              </div>

              <button
                type="button"
                className="pagos-cerrar"
                aria-label="Cerrar detalle"
                onClick={() => setPagoSeleccionado(null)}
              >
                ×
              </button>
            </header>

            <div className="pagos-modal-contenido">
              <div className="pagos-detalle-resumen">
                <span>Estado del pago</span>

                <strong
                  className={`pago-estado ${obtenerClaseEstado(
                    pagoSeleccionado.estado_codigo
                  )}`}
                >
                  {pagoSeleccionado.estado_nombre ||
                    pagoSeleccionado.estado_codigo}
                </strong>

                <span>Monto</span>
                <strong>{formatoCLP(pagoSeleccionado.monto)}</strong>
              </div>

              <h3>Información del pedido</h3>

              <dl className="pagos-detalle-lista">
                <dt>Folio del pedido</dt>
                <dd>{pagoSeleccionado.folio_pedido || "No disponible"}</dd>

                <dt>Cliente</dt>
                <dd>{pagoSeleccionado.cliente || "No disponible"}</dd>

                <dt>Método de pago</dt>
                <dd>{pagoSeleccionado.metodo_pago || "No disponible"}</dd>

                <dt>Fecha de creación</dt>
                <dd>{formatoFecha(pagoSeleccionado.fecha_creacion)}</dd>

                <dt>Fecha del pago</dt>
                <dd>{formatoFecha(pagoSeleccionado.fecha_pago)}</dd>

                <dt>Buy order</dt>
                <dd>{pagoSeleccionado.buy_order || "No disponible"}</dd>

                <dt>Referencia externa</dt>
                <dd>
                  {pagoSeleccionado.referencia_externa || "No disponible"}
                </dd>
              </dl>

              <h3>Respuesta del proveedor</h3>

              {(() => {
                const detalle = obtenerDetalleProveedor(
                  pagoSeleccionado.datos_proveedor
                );

                return (
                  <dl className="pagos-detalle-lista">
                    <dt>Proveedor</dt>
                    <dd>{detalle.proveedor}</dd>

                    <dt>Resultado informado</dt>
                    <dd>{detalle.estado}</dd>

                    <dt>Mensaje</dt>
                    <dd>{detalle.mensaje}</dd>

                    <dt>Referencia</dt>
                    <dd>{detalle.referencia}</dd>

                    <dt>Método informado</dt>
                    <dd>{detalle.metodo}</dd>

                    <dt>Comprobante</dt>
                    <dd>{detalle.comprobante}</dd>

                    <dt>Autorización</dt>
                    <dd>{detalle.autorizacion}</dd>

                    <dt>Código de respuesta</dt>
                    <dd>{detalle.codigoRespuesta}</dd>

                    <dt>Últimos dígitos</dt>
                    <dd>{detalle.ultimosDigitos}</dd>

                    <dt>Fecha informada</dt>
                    <dd>{formatoFecha(detalle.fecha)}</dd>
                  </dl>
                );
              })()}

              <p className="pagos-aviso">
                El detalle corresponde a la información almacenada en
                Supabase. No vuelve a consultar al proveedor.
              </p>
            </div>

            <footer className="pagos-modal-footer">
              <button
                type="button"
                onClick={() => setPagoSeleccionado(null)}
              >
                Cerrar
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

export default Pagos;
