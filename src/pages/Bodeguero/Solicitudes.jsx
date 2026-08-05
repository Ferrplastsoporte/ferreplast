import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";

import "./css/bodeguero.css";
import "./css/solicitudes.css";

const BUCKET_IMAGENES = "imagenes_productos";

const NOMBRES_CAMPOS = {
  nom_prod: "Nombre",
  desc_prod: "Descripción",
  detalle_prod: "Detalle",
  precio_prod: "Precio normal",
  precio_act: "Precio vigente",
  stock_prod: "Stock",
  imagen_url: "Imagen",
  id_und_medida: "Unidad de medida",
  peso_prod: "Peso o contenido",
  id_subcategoria: "Subcategoría",
  color_prod: "Color",
  id_marca: "Marca",
  est_prod: "Estado",
};

const NOMBRES_ACCIONES = {
  actualizacion: "Producto actualizado",
  ajuste_stock: "Stock actualizado",
  enviado_revision: "Enviado a revisión",
  producto_aprobado: "Producto aprobado",
  producto_no_disponible: "Marcado como no disponible",
  cambio_estado: "Estado modificado",
};

function formatearPrecio(valor) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

function formatearFecha(fecha) {
  if (!fecha) {
    return "";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(fecha));
}

function obtenerCamposModificados(campos = {}) {
  if (!campos || typeof campos !== "object" || Array.isArray(campos)) {
    return [];
  }

  return Object.keys(campos);
}

function resumirCamposModificados(campos = {}) {
  const nombres = obtenerCamposModificados(campos).map(
    (campo) => NOMBRES_CAMPOS[campo] || campo,
  );

  if (nombres.length === 0) {
    return "Sin detalle de campos";
  }

  if (nombres.length <= 3) {
    return nombres.join(", ");
  }

  return `${nombres.slice(0, 3).join(", ")} y ${nombres.length - 3} más`;
}

function BodegueroSolicitudes() {
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    cargarPendientes();
  }, []);

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return "";
    }

    if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
      return rutaImagen;
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGENES)
      .getPublicUrl(rutaImagen);

    return data.publicUrl;
  }

  async function cargarPendientes() {
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
        .eq("est_prod", 1)
        .order("created_prod", {
          ascending: false,
        });

      if (errorProductos) {
        throw errorProductos;
      }

      const productosPendientes = productos ?? [];

      if (productosPendientes.length === 0) {
        setPendientes([]);
        return;
      }

      const idsProductos = productosPendientes.map(
        (producto) => producto.id_prod,
      );

      const { data: cambios, error: errorCambios } = await supabase
        .from("producto_cambio")
        .select(
          `
          id_cambio,
          id_prod,
          id_user,
          fecha_cambio,
          tipo_accion,
          campos_modificados,
          estado_anterior,
          estado_nuevo,
          revisado,

          usuario (
            id_user,
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

      /*
       * Como los cambios vienen ordenados
       * desde el más reciente, conservamos
       * únicamente el primero de cada producto.
       */
      const ultimoCambioPorProducto = new Map();

      for (const cambio of cambios ?? []) {
        if (!ultimoCambioPorProducto.has(cambio.id_prod)) {
          ultimoCambioPorProducto.set(cambio.id_prod, cambio);
        }
      }

      const productosConCambio = productosPendientes.map((producto) => ({
        ...producto,
        ultimoCambio: ultimoCambioPorProducto.get(producto.id_prod) ?? null,
      }));

      setPendientes(productosConCambio);
    } catch (error) {
      console.error("Error al cargar productos pendientes:", error);

      setMensajeError(
        "No fue posible cargar los productos pendientes y su historial de cambios.",
      );

      setPendientes([]);
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <section className="bodeguero-page solicitudes-page">
        <p className="bodeguero-loading">Cargando productos pendientes...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page solicitudes-page">
      <BodegueroHeader
        titulo="Productos pendientes"
        descripcion="Consulta los productos que esperan revisión y aprobación del administrador."
      />

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button type="button" onClick={cargarPendientes}>
            Reintentar
          </button>
        </div>
      )}

      {pendientes.length === 0 ? (
        <section className="bodega-empty-state">
          <h2>No hay productos pendientes</h2>

          <p>
            Todos los productos registrados ya fueron revisados o no existen
            modificaciones pendientes.
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
              {pendientes.length}{" "}
              {pendientes.length === 1 ? "producto está" : "productos están"}{" "}
              esperando la revisión del administrador.
            </p>
          </div>

          <div className="solicitudes-table-wrapper">
            <table className="solicitudes-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Stock</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones realizadas</th>
                </tr>
              </thead>

              <tbody>
                {pendientes.map((producto) => {
                  const precioNormal = Number(producto.precio_prod);

                  const precioActual = Number(producto.precio_act);

                  const precioVigente =
                    precioActual > 0 ? precioActual : precioNormal;

                  const tieneOferta =
                    precioActual > 0 && precioActual < precioNormal;

                  const cambio = producto.ultimoCambio;

                  const nombreUsuario =
                    cambio?.usuario?.nom_user || "Bodeguero";

                  return (
                    <tr key={producto.id_prod}>
                      <td>
                        {producto.imagen_url ? (
                          <img
                            className="solicitudes-table__image"
                            src={obtenerUrlImagen(producto.imagen_url)}
                            alt={producto.nom_prod}
                            onError={(evento) => {
                              evento.currentTarget.style.display = "none";

                              evento.currentTarget.nextElementSibling?.removeAttribute(
                                "hidden",
                              );
                            }}
                          />
                        ) : null}

                        <div
                          className="solicitudes-table__placeholder"
                          hidden={Boolean(producto.imagen_url)}
                        >
                          Sin imagen
                        </div>
                      </td>

                      <td>
                        <div className="solicitudes-table__product">
                          <strong>{producto.nom_prod}</strong>

                          <span>
                            {producto.subcategoria?.nom_subcategoria ||
                              "Sin subcategoría"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {producto.marca_producto?.nom_marca || "Sin marca"}
                      </td>

                      <td>
                        <span className="stock-badge">
                          {producto.stock_prod} unidades
                        </span>
                      </td>

                      <td>
                        <div className="solicitudes-table__prices">
                          {tieneOferta && (
                            <span className="solicitudes-table__old-price">
                              {formatearPrecio(precioNormal)}
                            </span>
                          )}

                          <strong>{formatearPrecio(precioVigente)}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="estado-pendiente">Pendiente</span>
                      </td>

                      <td>
                        {cambio ? (
                          <div className="solicitudes-change">
                            <strong>
                              {NOMBRES_ACCIONES[cambio.tipo_accion] ||
                                "Producto modificado"}
                            </strong>

                            <span>
                              {resumirCamposModificados(
                                cambio.campos_modificados,
                              )}
                            </span>

                            <small>Por {nombreUsuario}</small>

                            <small>{formatearFecha(cambio.fecha_cambio)}</small>
                          </div>
                        ) : (
                          <div className="solicitudes-change solicitudes-change--empty">
                            <strong>Producto nuevo</strong>

                            <span>Pendiente de revisión inicial.</span>
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
