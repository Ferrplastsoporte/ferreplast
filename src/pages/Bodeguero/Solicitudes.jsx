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
      // ==========================================
      // 1. PRODUCTOS PENDIENTES (est_prod = 1)
      // ==========================================
      const { data: productosPendientes, error: errorPendientes } = await supabase
        .from("producto")
        .select(`
          id_prod,
          nom_prod,
          precio_prod,
          precio_act,
          imagen_url,
          created_prod,
          est_prod,
          stock_prod,
          estado_producto (id_est_prod, nom_est_prod),
          marca_producto (id_marca, nom_marca),
          subcategoria (id_subcategoria, nom_subcategoria)
        `)
        .eq("est_prod", 1)
        .order("created_prod", { ascending: false });

      if (errorPendientes) throw errorPendientes;

      // ==========================================
      // 2. PRODUCTOS DESACTIVADOS CON CAMBIOS PENDIENTES (est_prod = 3)
      // ==========================================
      const { data: productosDesactivados, error: errorDesactivados } = await supabase
        .from("producto")
        .select(`
          id_prod,
          nom_prod,
          precio_prod,
          precio_act,
          imagen_url,
          created_prod,
          est_prod,
          stock_prod,
          estado_producto (id_est_prod, nom_est_prod),
          marca_producto (id_marca, nom_marca),
          subcategoria (id_subcategoria, nom_subcategoria)
        `)
        .eq("est_prod", 3)
        .order("created_prod", { ascending: false });

      if (errorDesactivados) throw errorDesactivados;

      // ==========================================
      // 3. FILTRAR SOLO LOS DESACTIVADOS QUE TIENEN CAMBIO PENDIENTE
      // ==========================================
      const idsDesactivados = (productosDesactivados ?? []).map(p => p.id_prod);

      let desactivadosConCambio = [];

      if (idsDesactivados.length > 0) {
        const { data: cambios, error: errorCambios } = await supabase
          .from("producto_cambio")
          .select("id_prod, tipo_accion, fecha_cambio, usuario (nom_user)")
          .in("id_prod", idsDesactivados)
          .eq("revisado", false)
          .order("fecha_cambio", { ascending: false });

        if (errorCambios) throw errorCambios;

        const cambiosMap = new Map();
        for (const cambio of cambios ?? []) {
          if (!cambiosMap.has(cambio.id_prod)) {
            cambiosMap.set(cambio.id_prod, cambio);
          }
        }

        desactivadosConCambio = (productosDesactivados ?? [])
          .filter(p => cambiosMap.has(p.id_prod))
          .map(p => ({
            ...p,
            tipo: "producto",
            ultimoCambio: cambiosMap.get(p.id_prod),
            fecha: cambiosMap.get(p.id_prod)?.fecha_cambio || p.created_prod,
          }));
      }

      // ==========================================
      // 4. UNIFICAR SOLICITUDES
      // ==========================================

      // Productos pendientes (est_prod = 1)
      const solicitudesPendientes = (productosPendientes ?? []).map((producto) => ({
        ...producto,
        tipo: "producto",
        id: producto.id_prod,
        fecha: producto.created_prod,
        titulo: producto.nom_prod,
        subtitulo: producto.subcategoria?.nom_subcategoria || "Sin subcategoría",
        detalle: producto.marca_producto?.nom_marca || "Sin marca",
        estado: "Pendiente",
        ultimoCambio: null,
      }));

      // Productos desactivados con cambio pendiente
      const solicitudesDesactivados = desactivadosConCambio.map((producto) => ({
        ...producto,
        tipo: "producto",
        id: producto.id_prod,
        titulo: producto.nom_prod,
        subtitulo: producto.subcategoria?.nom_subcategoria || "Sin subcategoría",
        detalle: producto.marca_producto?.nom_marca || "Sin marca",
        estado: "Deshabilitado",
        ultimoCambio: producto.ultimoCambio,
      }));

      // ==========================================
      // 5. MARCAS PENDIENTES (est_marca = false)
      // ==========================================
      const { data: marcas, error: errorMarcas } = await supabase
        .from("marca_producto")
        .select(`
          id_marca,
          nom_marca,
          logo_url,
          marca_destacar,
          est_marca
        `)
        .eq("est_marca", false);

      if (errorMarcas) throw errorMarcas;

      const solicitudesMarcas = (marcas ?? []).map((marca) => ({
        ...marca,
        tipo: "marca",
        id: marca.id_marca,
        fecha: new Date().toISOString(),
        titulo: marca.nom_marca,
        subtitulo: marca.marca_destacar ? "Marca destacada" : "Marca normal",
        detalle: "Pendiente de aprobación",
        estado: "Pendiente",
        logo_url: marca.logo_url,
        ultimoCambio: null,
      }));

      // ==========================================
      // 6. UNIFICAR Y ORDENAR
      // ==========================================
      const todas = [
        ...solicitudesPendientes,
        ...solicitudesDesactivados,
        ...solicitudesMarcas,
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      setSolicitudes(todas);
    } catch (error) {
      console.error("❌ Error al cargar solicitudes:", error);
      setMensajeError("No fue posible cargar las solicitudes pendientes.");
      setSolicitudes([]);
    } finally {
      setCargando(false);
    }
  }

  // ==========================================
  // FILTRAR POR TIPO
  // ==========================================
  const totalProductos = solicitudes.filter(
    (s) => s.tipo === "producto" && s.estado !== "Deshabilitado"
  ).length;

  const totalDeshabilitados = solicitudes.filter(
    (s) => s.tipo === "producto" && s.estado === "Deshabilitado"
  ).length;

  const totalMarcas = solicitudes.filter((s) => s.tipo === "marca").length;

  const solicitudesFiltradas = (() => {
    if (filtroTipo === "todos") return solicitudes;
    if (filtroTipo === "productos") {
      return solicitudes.filter(
        (s) => s.tipo === "producto" && s.estado !== "Deshabilitado"
      );
    }
    if (filtroTipo === "deshabilitados") {
      return solicitudes.filter(
        (s) => s.tipo === "producto" && s.estado === "Deshabilitado"
      );
    }
    if (filtroTipo === "marcas") {
      return solicitudes.filter((s) => s.tipo === "marca");
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
        <div className="bodeguero-message bodeguero-message--error" role="alert">
          <p>{mensajeError}</p>
          <button type="button" onClick={cargarSolicitudes}>
            Reintentar
          </button>
        </div>
      )}

      <div className="solicitudes-filtros">
        <button
          type="button"
          className={`solicitudes-filtro ${filtroTipo === "todos" ? "active" : ""}`}
          onClick={() => setFiltroTipo("todos")}
        >
          Todos ({solicitudes.length})
        </button>
        <button
          type="button"
          className={`solicitudes-filtro ${filtroTipo === "productos" ? "active" : ""}`}
          onClick={() => setFiltroTipo("productos")}
        >
          Productos ({totalProductos})
        </button>
        <button
          type="button"
          className={`solicitudes-filtro ${filtroTipo === "deshabilitados" ? "active" : ""}`}
          onClick={() => setFiltroTipo("deshabilitados")}
        >
          Deshabilitados ({totalDeshabilitados})
        </button>
        <button
          type="button"
          className={`solicitudes-filtro ${filtroTipo === "marcas" ? "active" : ""}`}
          onClick={() => setFiltroTipo("marcas")}
        >
          Marcas ({totalMarcas})
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
          <div className="bodeguero-message bodeguero-message--info" role="status">
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
                  <th>Tipo</th>
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
                  const nombreUsuario = cambio?.usuario?.nom_user || "Bodeguero";
                  
                  // 🔹 CORREGIDO: Usar est_prod para determinar si es deshabilitado
                  const esDeshabilitado = solicitud.estado === "Deshabilitado";
                  const estadoClase = esDeshabilitado ? "estado-deshabilitado" : "estado-pendiente";
                  const estadoTexto = esDeshabilitado ? "⛔ Deshabilitado" : "⏳ Pendiente";

                  return (
                    <tr key={`${solicitud.tipo}-${solicitud.id}`}>
                      <td>
                        <span className={`tipo-badge tipo-${solicitud.tipo}`}>
                          {esProducto ? "📦 Producto" : "🏷️ Marca"}
                        </span>
                      </td>

                      <td>
                        {esProducto ? (
                          solicitud.imagen_url ? (
                            <img
                              className="solicitudes-table__image"
                              src={obtenerUrlImagen(solicitud.imagen_url)}
                              alt={solicitud.nom_prod}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.removeAttribute(
                                  "hidden"
                                );
                              }}
                            />
                          ) : (
                            <div className="solicitudes-table__placeholder">
                              Sin imagen
                            </div>
                          )
                        ) : (
                          solicitud.logo_url ? (
                            <img
                              className="solicitudes-table__image"
                              src={obtenerUrlImagen(solicitud.logo_url)}
                              alt={solicitud.nom_marca}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                e.currentTarget.nextElementSibling?.removeAttribute(
                                  "hidden"
                                );
                              }}
                            />
                          ) : (
                            <div className="solicitudes-table__placeholder">
                              Sin logo
                            </div>
                          )
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
                        <span className={estadoClase}>
                          {estadoTexto}
                        </span>
                      </td>

                      <td>
                        <small>{formatearFecha(solicitud.fecha)}</small>
                      </td>

                      <td>
                        {esProducto && cambio ? (
                          <div className="solicitudes-change">
                            <strong>
                              {NOMBRES_ACCIONES[cambio.tipo_accion] ||
                                "Producto modificado"}
                            </strong>
                            <span>
                              {resumirCamposModificados(
                                cambio.campos_modificados
                              )}
                            </span>
                            <small>Por {nombreUsuario}</small>
                            <small>{formatearFecha(cambio.fecha_cambio)}</small>
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