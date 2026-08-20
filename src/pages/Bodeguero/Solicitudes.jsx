import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";

import {
  NOMBRES_ACCIONES,
  formatearFecha,
  obtenerDetalleCambios,
} from "../../utils/solicitudes";

import "./css/bodeguero.css";
import "./css/solicitudes.css";

const BUCKET_IMAGENES = "imagenes_productos";

function BodegueroSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

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
        .in("est_prod", [1, 3])
        .order("created_prod", {
          ascending: false,
        });

      if (errorProductos) {
        throw errorProductos;
      }

      const idsProductos = (productos ?? []).map(
        (producto) => producto.id_prod,
      );

      const cambiosMap = new Map();

      if (idsProductos.length > 0) {
        const { data: cambios, error: errorCambios } = await supabase
          .from("producto_cambio")
          .select(
            `
            id_prod,
            tipo_accion,
            campos_modificados,
            fecha_cambio,

            usuario (
              nom_user
            )
          `,
          )
          .in("id_prod", idsProductos)
          .eq("revisado", false)
          .order("fecha_cambio", {
            ascending: false,
          });

        if (errorCambios) {
          throw errorCambios;
        }

        for (const cambio of cambios ?? []) {
          if (!cambiosMap.has(cambio.id_prod)) {
            cambiosMap.set(cambio.id_prod, cambio);
          }
        }
      }

      const solicitudesProductos = (productos ?? [])
        .filter((producto) => {
          if (Number(producto.est_prod) === 1) {
            return true;
          }

          if (Number(producto.est_prod) === 3) {
            return cambiosMap.has(producto.id_prod);
          }

          return false;
        })
        .map((producto) => {
          const ultimoCambio = cambiosMap.get(producto.id_prod) ?? null;

          const esDeshabilitado = Number(producto.est_prod) === 3;

          return {
            ...producto,
            tipo: "producto",
            id: producto.id_prod,

            fecha: ultimoCambio?.fecha_cambio ?? producto.created_prod,

            titulo: producto.nom_prod,

            subtitulo:
              producto.subcategoria?.nom_subcategoria || "Sin subcategoría",

            detalle: producto.marca_producto?.nom_marca || "Sin marca",

            estado: esDeshabilitado ? "Deshabilitado" : "Pendiente",

            ultimoCambio,
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
          est_marca
        `,
        )
        .eq("est_marca", false);

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
        detalle: "Pendiente de aprobación",
        estado: "Pendiente",
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
      solicitud.tipo === "producto" && solicitud.estado !== "Deshabilitado",
  ).length;

  const totalDeshabilitados = solicitudes.filter(
    (solicitud) =>
      solicitud.tipo === "producto" && solicitud.estado === "Deshabilitado",
  ).length;

  const totalMarcas = solicitudes.filter(
    (solicitud) => solicitud.tipo === "marca",
  ).length;

  const solicitudesFiltradas = (() => {
    if (filtroTipo === "todos") {
      return solicitudes;
    }

    if (filtroTipo === "productos") {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.tipo === "producto" && solicitud.estado !== "Deshabilitado",
      );
    }

    if (filtroTipo === "deshabilitados") {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.tipo === "producto" && solicitud.estado === "Deshabilitado",
      );
    }

    if (filtroTipo === "marcas") {
      return solicitudes.filter((solicitud) => solicitud.tipo === "marca");
    }

    return solicitudes;
  })();

  if (cargando) {
    return (
      <section className="bodeguero-page solicitudes-page">
        <p className="bodeguero-loading">Cargando solicitudes...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page solicitudes-page">
      <BodegueroHeader
        titulo="Solicitudes pendientes"
        descripcion="Consulta los productos y marcas que esperan revisión del administrador."
      />

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
            filtroTipo === "todos" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("todos")}
        >
          Todos ({solicitudes.length})
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

        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "marcas" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("marcas")}
        >
          Marcas ({totalMarcas})
        </button>

        <button
          type="button"
          className={`solicitudes-filtro ${
            filtroTipo === "deshabilitados" ? "active" : ""
          }`}
          onClick={() => setFiltroTipo("deshabilitados")}
        >
          Deshabilitados ({totalDeshabilitados})
        </button>
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <section className="bodega-empty-state">
          <h2>No hay solicitudes pendientes</h2>

          <p>
            {filtroTipo === "todos"
              ? "No hay productos ni marcas pendientes de revisión."
              : filtroTipo === "productos"
                ? "No hay productos pendientes de revisión."
                : filtroTipo === "deshabilitados"
                  ? "No hay productos deshabilitados pendientes de revisión."
                  : "No hay marcas pendientes de revisión."}
          </p>

          <Link to="/bodeguero/productos">Ir a gestión de productos</Link>
        </section>
      ) : (
        <>
          <div
            className="bodeguero-message bodeguero-message--info"
            role="status"
          >
            <p>
              {solicitudesFiltradas.length}{" "}
              {solicitudesFiltradas.length === 1
                ? "solicitud está"
                : "solicitudes están"}{" "}
              esperando revisión del administrador.
            </p>
          </div>

          <div className="solicitudes-table-wrapper">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>Imagen / Logo</th>
                  <th>Nombre</th>
                  <th>Detalle</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones realizadas</th>
                </tr>
              </thead>

              <tbody>
                {solicitudesFiltradas.map((solicitud) => {
                  const esProducto = solicitud.tipo === "producto";

                  const cambio = solicitud.ultimoCambio;

                  const nombreUsuario =
                    cambio?.usuario?.nom_user || "Bodeguero";

                  const detalleCambios = cambio
                    ? obtenerDetalleCambios(cambio.campos_modificados)
                    : [];

                  const esDeshabilitado = solicitud.estado === "Deshabilitado";

                  const estadoClase = esDeshabilitado
                    ? "estado-deshabilitado"
                    : "estado-pendiente";

                  const estadoTexto = esDeshabilitado
                    ? "⛔ Deshabilitado"
                    : "⏳ Pendiente";

                  const rutaImagen = esProducto
                    ? solicitud.imagen_url
                    : solicitud.logo_url;

                  return (
                    <tr key={`${solicitud.tipo}-${solicitud.id}`}>
                      
                      <td>
                        {rutaImagen ? (
                          <img
                            className="solicitudes-table__image"
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
                      </td>

                      <td>
                        <div className="solicitudes-table__product">
                          <strong>{solicitud.titulo}</strong>

                          <span>{solicitud.subtitulo}</span>
                        </div>
                      </td>

                      <td>{solicitud.detalle}</td>

                      <td>
                        <span className={estadoClase}>{estadoTexto}</span>
                      </td>

                      <td>
                        <small>
                          {solicitud.fecha
                            ? formatearFecha(solicitud.fecha)
                            : "Sin fecha registrada"}
                        </small>
                      </td>

                      <td>
                        {esProducto && cambio ? (
                          <div className="solicitudes-change">
                            <strong>
                              {NOMBRES_ACCIONES[cambio.tipo_accion] ||
                                "Producto modificado"}
                            </strong>

                            {detalleCambios.length > 0 ? (
                              <div className="solicitudes-change__details">
                                {detalleCambios.map((detalle) => (
                                  <span key={detalle.campo}>
                                    <strong>{detalle.campo}:</strong>{" "}
                                    {detalle.anterior} → {detalle.nuevo}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span>Sin detalle de campos</span>
                            )}

                            <small>Por {nombreUsuario}</small>
                          </div>
                        ) : esProducto ? (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Producto nuevo</strong>

                            <span>Pendiente de revisión inicial.</span>
                          </div>
                        ) : (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Marca nueva</strong>

                            <span>Pendiente de aprobación.</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default BodegueroSolicitudes;
