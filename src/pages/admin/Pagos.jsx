
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminHeader from "./components/AdminHeader";
import "./css/Pagos.css";

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

async function listarPagosAdmin(busqueda = "") {
  const { data, error } = await supabase.rpc(
    "admin_listar_pagos",
    {
      p_busqueda: busqueda.trim() || null,
    }
  );

  console.log("[Pagos] Error RPC:", error);
  console.log("[Pagos] Cantidad recibida:", data?.length ?? 0);
  console.log(
    "[Pagos] Folios recibidos:",
    (data ?? []).map((pago) => pago.folio_pago)
  );

  if (error) {
    throw error;
  }

  return data ?? [];
}

function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const cargarPagos = useCallback(async (termino = "") => {
    setCargando(true);
    setError("");

    try {
      const resultado = await listarPagosAdmin(termino);

      // La RPC debe devolver los pagos con folio.
      // Se excluyen únicamente registros sin folio válido.
      const pagosConFolio = resultado.filter(
        (pago) =>
          typeof pago.folio_pago === "string" &&
          pago.folio_pago.trim() !== ""
      );

      console.log("[Pagos] Total tras validar folios:", pagosConFolio.length);

      setPagos(pagosConFolio);
    } catch (err) {
      console.error("[Pagos] Error al cargar:", err);

      setError(
        err?.message ||
          "No fue posible cargar los pagos desde Supabase."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);

  const pagosFiltrados = useMemo(() => {
    if (filtroEstado === "TODOS") {
      return pagos;
    }

    return pagos.filter(
      (pago) =>
        normalizarEstado(pago.estado_codigo) === filtroEstado
    );
  }, [pagos, filtroEstado]);

  const resumen = useMemo(() => {
    const autorizados = pagos.filter(
      (pago) =>
        normalizarEstado(pago.estado_codigo) === "AUTORIZADO"
    );

    return {
      cantidad: pagos.length,
      autorizados: autorizados.length,
      montoAutorizado: autorizados.reduce(
        (total, pago) => total + Number(pago.monto || 0),
        0
      ),
    };
  }, [pagos]);

  const buscar = (event) => {
    event.preventDefault();
    cargarPagos(busqueda.trim());
  };

  const actualizar = () => {
    setActualizando(true);
    cargarPagos(busqueda.trim());
  };

  const abrirDetalle = (pago) => {
    setPagoSeleccionado(pago);
  };

  return (
    <section className="admin-page pagos-page">
      <AdminHeader
        titulo="Pagos"
        descripcion="Consulta los pagos asociados a los pedidos realizados en la plataforma."
      />

      <section className="admin-section pagos-contenido">
        <div className="pagos-resumen">
          <article className="pagos-resumen-card">
            <span>Pagos con folio</span>
            <strong>{resumen.cantidad}</strong>
          </article>

          <article className="pagos-resumen-card">
            <span>Pagos autorizados</span>
            <strong>{resumen.autorizados}</strong>
          </article>

          <article className="pagos-resumen-card">
            <span>Monto autorizado</span>
            <strong>{formatoCLP(resumen.montoAutorizado)}</strong>
          </article>
        </div>

        <form className="pagos-buscador" onSubmit={buscar}>
          <div className="pagos-campo-busqueda">
            <label htmlFor="buscar-pago">
              Buscar por folio o referencia
            </label>

            <input
              id="buscar-pago"
              type="search"
              placeholder="Ej.: PAG-20261015-0004"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <button type="submit" disabled={cargando}>
            Buscar
          </button>

          <button
            type="button"
            className="pagos-boton-secundario"
            onClick={actualizar}
            disabled={cargando}
          >
            {actualizando ? "Actualizando..." : "Actualizar"}
          </button>
        </form>

        <div className="pagos-filtros">
          <label htmlFor="filtro-estado">Estado del pago</label>

          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="AUTORIZADO">Autorizados</option>
            <option value="CREADO">Creados</option>
            <option value="INICIALIZADO">Inicializados</option>
            <option value="RECHAZADO">Rechazados</option>
            <option value="ABORTADO">Abortados</option>
            <option value="EXPIRADO">Expirados</option>
            <option value="ERROR_CONFIRMACION">Error de confirmación</option>
            <option value="REVERSADO">Reversados</option>
            <option value="ANULADO">Anulados</option>
            <option value="PARCIALMENTE_ANULADO">
              Parcialmente anulados
            </option>
          </select>
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
              ) : pagosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pagos-tabla-vacio">
                    No se encontraron pagos para esta búsqueda.
                  </td>
                </tr>
              ) : (
                pagosFiltrados.map((pago) => (
                  <tr key={pago.folio_pago}>
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

        <p className="pagos-nota">
          Se muestran únicamente pagos que tienen un folio asignado.
        </p>
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
