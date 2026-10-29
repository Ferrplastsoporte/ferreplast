import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiRefreshCw } from "react-icons/fi";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";

import {
  NOMBRES_ACCIONES,
  formatearFecha,
  obtenerDetalleCambios,
  esSolicitudStock,
  obtenerEstadoSolicitud,
  obtenerDatosSolicitud,
} from "../../utils/solicitudes/solicitudes";
import { obtenerNombresReferenciasCambios } from "../../services/solicitudesService";

import "./css/bodeguero.css";
import "./css/solicitudes.css";

const BUCKET_IMAGENES = "imagenes_productos";

function BodegueroSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("pendientes");
  const [nombresReferencias, setNombresReferencias] = useState({});
  const [solicitudesExpandidas, setSolicitudesExpandidas] = useState([]);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) return "";

    if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGENES)
      .getPublicUrl(rutaImagen);

    return data.publicUrl;
  }

  async function cargarSolicitudes() {
    setCargando(true);
    setMensajeError("");
    setSolicitudesExpandidas([]);

    try {
      const { data: productos, error: errorProductos } = await supabase
        .from("producto")
        .select(
          `
          id_prod,
          nom_prod,
          precio_prod,
          precio_act,
          imagen_url,
          created_prod,
          est_prod,
          stock_prod,

          estado_producto (
            id_est_prod,
            nom_est_prod
          ),

          marca_producto (
            id_marca,
            nom_marca
          ),

          subcategoria (
            id_subcategoria,
            nom_subcategoria
          )
        `,
        )
        .order("created_prod", {
          ascending: false,
        });

      if (errorProductos) {
        throw errorProductos;
      }

      const idsProductos = (productos ?? []).map(
        (producto) => producto.id_prod,
      );

      let cambiosProductos = [];

      if (idsProductos.length > 0) {
        const { data: cambios, error: errorCambios } = await supabase
          .from("producto_cambio")
          .select(
            `
            id_cambio,
            id_prod,
            id_user,
            tipo_accion,
            campos_modificados,
            fecha_cambio,
            revisado,
            comentario,

            usuario (
              nom_user
            )
          `,
          )
          .in("id_prod", idsProductos)
          .contains("campos_modificados", { _solicitud: { version: 1 } })
          .not("id_user", "is", null)
          .order("id_cambio", {
            ascending: false,
          });

        if (errorCambios) {
          throw errorCambios;
        }

        cambiosProductos = cambios ?? [];

      }

      const referencias = await obtenerNombresReferenciasCambios(
        cambiosProductos,
      );

      const productosPorId = new Map((productos ?? []).map((producto) => [String(producto.id_prod), producto]));
      // Cada fila es una solicitud, no el estado actual del producto.
      // Así un rechazo o aprobación anteriores siguen visibles al reenviar.
      const solicitudesProductos = cambiosProductos
        .filter((cambio) => obtenerEstadoSolicitud(cambio))
        .map((cambio) => {
          const producto = productosPorId.get(String(cambio.id_prod));
          return {
            ...producto,
            tipo: esSolicitudStock(cambio) ? "stock" : "producto",
            id: cambio.id_cambio,
            idProducto: cambio.id_prod,
            fecha: cambio.fecha_cambio,
            titulo: producto?.nom_prod || obtenerDatosSolicitud(cambio)?.datos_propuestos?.nom_prod || `Producto #${cambio.id_prod}`,
            subtitulo: producto?.subcategoria?.nom_subcategoria || "Sin subcategoría",
            detalle: producto?.marca_producto?.nom_marca || "Sin marca",
            estado: obtenerEstadoSolicitud(cambio),
            ultimoCambio: cambio,
          };
        });

      const { data: marcas, error: errorMarcas } = await supabase
        .from("marca_producto")
        .select(
          `
          id_marca,
          nom_marca,
          logo_url,
          marca_destacar,
          id_estado_marca
        `,
        )
        .in("id_estado_marca", [1, 3]);

      if (errorMarcas) {
        throw errorMarcas;
      }

      const solicitudesMarcas = (marcas ?? []).map((marca) => ({
        ...marca,
        tipo: "marca",
        id: marca.id_marca,
        fecha: null,
        titulo: marca.nom_marca,
        subtitulo: marca.marca_destacar ? "Marca destacada" : "Marca normal",
        detalle: Number(marca.id_estado_marca) === 3
          ? "Solicitud rechazada"
          : "Pendiente de aprobación",
        estado: Number(marca.id_estado_marca) === 3 ? "Rechazado" : "Pendiente",
        ultimoCambio: null,
      }));

      const todas = [...solicitudesProductos, ...solicitudesMarcas].sort(
        (a, b) => {
          if (!a.fecha && !b.fecha) return 0;
          if (!a.fecha) return 1;
          if (!b.fecha) return -1;

          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        },
      );

      setSolicitudes(todas);
      setNombresReferencias(referencias);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);

      setMensajeError("No fue posible cargar las solicitudes pendientes.");

      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  }

  const totalProductos = solicitudes.filter(
    (solicitud) =>
      solicitud.tipo === "producto" && solicitud.estado === "Pendiente",
  ).length;

  const totalStock = solicitudes.filter(
    (solicitud) => solicitud.tipo === "stock" && solicitud.estado === "Pendiente",
  ).length;

  const totalAprobados = solicitudes.filter(
    (solicitud) => solicitud.estado === "Aprobado",
  ).length;

  const totalRechazados = solicitudes.filter(
    (solicitud) => solicitud.estado === "Rechazado",
  ).length;

  const totalMarcas = solicitudes.filter(
    (solicitud) => solicitud.tipo === "marca",
  ).length;

  const totalPendientes = solicitudes.filter(
    (solicitud) => solicitud.estado === "Pendiente",
  ).length;

  const solicitudesFiltradas = (() => {
    if (filtroTipo === "pendientes") {
      return solicitudes.filter(
        (solicitud) => solicitud.estado === "Pendiente",
      );
    }

    if (filtroTipo === "productos") {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.tipo === "producto" && solicitud.estado === "Pendiente",
      );
    }

    if (filtroTipo === "stock") {
      return solicitudes.filter((solicitud) => solicitud.tipo === "stock" && solicitud.estado === "Pendiente");
    }

    if (filtroTipo === "aprobados") {
      return solicitudes.filter((solicitud) => solicitud.estado === "Aprobado");
    }

    if (filtroTipo === "rechazados") {
      return solicitudes.filter(
        (solicitud) => solicitud.estado === "Rechazado",
      );
    }

    if (filtroTipo === "marcas") {
      return solicitudes.filter((solicitud) => solicitud.tipo === "marca");
    }

    return solicitudes;
  })();

  const encabezado = (
    <BodegueroHeader
      titulo="Solicitudes"
      descripcion="Consulta solicitudes de productos, ajustes de stock, resultados de revisión y marcas."
      acciones={
        <button
          type="button"
          className="solicitudes-recargar"
          onClick={cargarSolicitudes}
          disabled={cargando}
          aria-label="Actualizar solicitudes"
          title="Actualizar solicitudes"
        >
          <FiRefreshCw aria-hidden="true" />
        </button>
      }
    />
  );

  if (cargando) {
    return (
      <section className="bodeguero-page solicitudes-page">
        {encabezado}
        <p className="bodeguero-loading">Cargando solicitudes...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page solicitudes-page">
      {encabezado}

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button type="button" onClick={cargarSolicitudes}>
            Reintentar
          </button>
        </div>
      )}

      <div className="solicitudes-filtros">
        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "pendientes" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("pendientes")}
        >
          Pendientes ({totalPendientes})
        </button>

        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "productos" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("productos")}
        >
          Productos ({totalProductos})
        </button>

        <button type="button"
          className={`solicitudes-filtro ${filtroTipo === "stock" ? "active" : ""}`}
          onClick={() => setFiltroTipo("stock")}>
          Stock ({totalStock})
        </button>

        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "marcas" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("marcas")}
        >
          Marcas ({totalMarcas})
        </button>

        <button type="button"
          className={`solicitudes-filtro ${filtroTipo === "aprobados" ? "active" : ""}`}
          onClick={() => setFiltroTipo("aprobados")}>
          Aprobados ({totalAprobados})
        </button>

        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "rechazados" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("rechazados")}
        >
          Rechazados ({totalRechazados})
        </button>
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <section className="bodega-empty-state">
          <h2>No hay solicitudes en esta sección</h2>

          <p>
            {filtroTipo === "pendientes"
              ? "No hay solicitudes pendientes de revisión."
              : filtroTipo === "productos"
                ? "No hay productos pendientes de revisión."
                : filtroTipo === "stock"
                  ? "No hay ajustes de stock pendientes de revisión."
                  : filtroTipo === "aprobados"
                    ? "Todavía no hay solicitudes de productos o stock aprobadas."
                : filtroTipo === "rechazados"
                  ? "No hay solicitudes rechazadas que requieran cambios."
                  : "No hay solicitudes de marcas pendientes ni rechazadas."}
          </p>

          <Link to="/bodeguero/productos">Ir a gestión de productos</Link>
        </section>
      ) : (
        <section className="solicitudes-panel" aria-labelledby="titulo-solicitudes-tabla">
          <div className="solicitudes-panel__cabecera">
            <span className="solicitudes-panel__etiqueta">Productos, stock y marcas</span>
            <h2 id="titulo-solicitudes-tabla">
              {filtroTipo === "rechazados"
                ? "Solicitudes rechazadas"
                : filtroTipo === "aprobados"
                  ? "Solicitudes aprobadas"
                  : filtroTipo === "stock"
                    ? "Ajustes de stock pendientes"
                : filtroTipo === "marcas"
                  ? "Solicitudes de marcas"
                  : "Cambios pendientes"}
            </h2>
            <p>{solicitudesFiltradas.length} {solicitudesFiltradas.length === 1 ? "solicitud" : "solicitudes"} · Abre el detalle para consultar los cambios.</p>
          </div>

          <div className="solicitudes-table-wrapper">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>Producto / Marca</th>
                  <th>Solicitado por</th>
                  <th>Último cambio</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>

              <tbody>
                {solicitudesFiltradas.map((solicitud) => {
                  const esProducto = solicitud.tipo !== "marca";
                  const clave = `${solicitud.tipo}-${solicitud.id}`;
                  const expandido = solicitudesExpandidas.includes(clave);
                  const detalleId = `solicitud-detalle-${clave}`;

                  const cambio = solicitud.ultimoCambio;

                  const nombreUsuario =
                    cambio?.usuario?.nom_user || "No registrado";

                  const detalleCambios = cambio
                    ? obtenerDetalleCambios(
                        cambio.campos_modificados,
                        nombresReferencias,
                      )
                    : [];

                  const esRechazado = solicitud.estado === "Rechazado";
                  const esAprobado = solicitud.estado === "Aprobado";

                  const estadoClase = esRechazado
                    ? "estado-rechazado"
                    : esAprobado ? "solicitudes-estado-aprobado" : "estado-pendiente";

                  const estadoTexto = esRechazado
                    ? "Rechazado"
                    : esAprobado ? "Aprobado" : "Pendiente";

                  const nombreAccion = cambio
                    ? NOMBRES_ACCIONES[cambio.tipo_accion] || "Producto modificado"
                    : esRechazado
                      ? "Solicitud rechazada"
                      : "Pendiente de revisión";

                  const rutaImagen = esProducto
                    ? solicitud.imagen_url
                    : solicitud.logo_url;

                  return (
                    <Fragment key={clave}>
                    <tr>
                      <td>
                        <div className="solicitudes-elemento">
                        {rutaImagen ? (
                          <img
                            className={`solicitudes-table__image ${!esProducto ? "solicitudes-table__image--logo" : ""}`}
                            src={obtenerUrlImagen(rutaImagen)}
                            alt={solicitud.titulo}
                            onError={(evento) => {
                              evento.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="solicitudes-table__placeholder">
                            {esProducto ? "Sin imagen" : "Sin logo"}
                          </div>
                        )}
                        <div className="solicitudes-table__product">
                          <strong>{solicitud.titulo}</strong>
                          <span>{esProducto ? `${solicitud.detalle} · ${solicitud.subtitulo}` : solicitud.subtitulo}</span>
                          <small>{esProducto ? "Item" : "Marca"} #{esProducto ? solicitud.idProducto : solicitud.id}</small>
                          {solicitud.tipo === "stock" && <small>Ajuste de stock · Solicitud #{solicitud.id}</small>}
                        </div>
                        </div>
                      </td>

                      <td><strong className="solicitudes-usuario">{nombreUsuario}</strong></td>

                      <td>
                        <div className="solicitudes-fecha">
                          <strong>{nombreAccion}</strong>
                          <span>{solicitud.fecha ? formatearFecha(solicitud.fecha) : "Sin fecha registrada"}</span>
                        </div>
                      </td>

                      <td>
                        <span className={estadoClase}>{estadoTexto}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="solicitudes-btn-detalle"
                          aria-expanded={expandido}
                          aria-controls={detalleId}
                          onClick={() => setSolicitudesExpandidas((actuales) =>
                            actuales.includes(clave)
                              ? actuales.filter((id) => id !== clave)
                              : [...actuales, clave],
                          )}
                        >
                          {expandido ? "Ocultar cambios" : "Ver cambios"}
                        </button>
                      </td>
                    </tr>
                    <tr id={detalleId} hidden={!expandido} className="solicitudes-fila-detalle">
                      <td colSpan="5">
                      {expandido && (esProducto && cambio ? (
                          <div className="solicitudes-change">
                            <header>
                              <strong>
                              {NOMBRES_ACCIONES[cambio.tipo_accion] ||
                                "Producto modificado"}
                              </strong>
                              <span>{formatearFecha(cambio.fecha_cambio)}</span>
                            </header>

                            {solicitud.tipo === "stock" && solicitud.estado === "Pendiente" && (
                              <p className="solicitudes-aclaracion">La cantidad nueva es una propuesta. Todavía no se ha aplicado al stock real.</p>
                            )}

                            {obtenerDatosSolicitud(cambio)?.fecha_resolucion && (
                              <p className="solicitudes-aclaracion">
                                {estadoTexto} el {formatearFecha(obtenerDatosSolicitud(cambio).fecha_resolucion)}.
                                {esRechazado && (solicitud.tipo === "stock"
                                  ? " El ajuste no se aplicó; puedes corregirlo y enviar otra solicitud."
                                  : obtenerDatosSolicitud(cambio)?.tipo === "modificacion"
                                    ? " Se restauraron los datos anteriores, excepto imágenes y documentos. Puedes corregir el producto y reenviarlo."
                                    : " Puedes corregir el producto y reenviarlo.")}
                              </p>
                            )}

                            {cambio.comentario && (
                              <div className="solicitudes-comentario">
                                <strong>Comentario de administración</strong>
                                <p>{cambio.comentario}</p>
                              </div>
                            )}

                            {detalleCambios.length > 0 ? (
                              <ul className="solicitudes-change__details">
                                {detalleCambios.map((detalle, indice) => (
                                  <li key={`${detalle.campo}-${indice}`}>
                                    <strong>{detalle.campo}</strong>
                                    <span>{detalle.anterior}</span>
                                    <b aria-hidden="true">→</b>
                                    <span>{detalle.nuevo}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span>Sin detalle de campos</span>
                            )}

                            <small>Por {nombreUsuario}</small>
                          </div>
                        ) : esRechazado ? (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Solicitud rechazada</strong>

                            <span>Realiza cambios para enviarla nuevamente.</span>
                          </div>
                        ) : esProducto ? (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Producto nuevo</strong>

                            <span>Pendiente de revisión inicial.</span>
                          </div>
                        ) : (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Solicitud de marca</strong>

                            <span>Pendiente de aprobación.</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}

export default BodegueroSolicitudes;
