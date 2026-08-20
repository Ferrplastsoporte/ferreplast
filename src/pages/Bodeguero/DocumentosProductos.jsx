import { useEffect, useMemo, useState } from "react";

import {
  obtenerProductosConDocumentos,
  obtenerDocumentosProducto,
  habilitarDocumento,
  deshabilitarDocumento,
  obtenerUrlDocumento,
  agregarDocumentoProducto,
} from "../../services/productoDocumentoService";

import "./css/documentoProducto.css";

const DocumentosProductos = () => {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("con_documentos");

  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);

  const [procesandoDocumento, setProcesandoDocumento] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [mostrarAgregarDocumento, setMostrarAgregarDocumento] = useState(false);

  const [nuevoTipoDocumento, setNuevoTipoDocumento] = useState("");
  const [nuevoArchivo, setNuevoArchivo] = useState(null);

  const [subiendoDocumento, setSubiendoDocumento] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setCargandoProductos(true);
      setError("");

      const data = await obtenerProductosConDocumentos();

      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos con documentos:", err);

      setError(
        err?.message || "No fue posible cargar los productos con documentos.",
      );
    } finally {
      setCargandoProductos(false);
    }
  };

  const seleccionarProducto = async (producto) => {
    try {
      setProductoSeleccionado(producto);

      setCargandoDocumentos(true);

      setError("");
      setMensaje("");

      setMostrarAgregarDocumento(false);
      setNuevoTipoDocumento("");
      setNuevoArchivo(null);

      const data = await obtenerDocumentosProducto(producto.id_prod);

      setDocumentos(data);
    } catch (err) {
      console.error("Error al cargar documentos:", err);

      setDocumentos([]);

      setError(
        err?.message || "No fue posible cargar los documentos del producto.",
      );
    } finally {
      setCargandoDocumentos(false);
    }
  };

  const recargarProductoSeleccionado = async () => {
    if (!productoSeleccionado) return;

    const documentosActualizados = await obtenerDocumentosProducto(
      productoSeleccionado.id_prod,
    );

    setDocumentos(documentosActualizados);

    await cargarProductos();
  };

  const actualizarEstadoDocumento = async (documento) => {
    try {
      setProcesandoDocumento(documento.id_documento);

      setError("");
      setMensaje("");

      if (documento.est_documento) {
        await deshabilitarDocumento(documento.id_documento);

        setMensaje(
          `El documento "${documento.nombre_documento}" fue deshabilitado correctamente.`,
        );
      } else {
        await habilitarDocumento(documento.id_documento);

        setMensaje(
          `El documento "${documento.nombre_documento}" fue habilitado correctamente.`,
        );
      }

      await recargarProductoSeleccionado();
    } catch (err) {
      console.error("Error al modificar documento:", err);

      setError(
        err?.message || "No fue posible modificar el estado del documento.",
      );
    } finally {
      setProcesandoDocumento(null);
    }
  };

  const verDocumento = async (documento) => {
    try {
      setError("");
      setMensaje("");

      const url = await obtenerUrlDocumento(documento.archivo_path);

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Error al abrir documento:", err);

      setError(err?.message || "No fue posible abrir el documento.");
    }
  };

  const guardarNuevoDocumento = async (e) => {
    e.preventDefault();

    if (!productoSeleccionado) {
      setError("Debes seleccionar un producto.");
      return;
    }

    if (!nuevoTipoDocumento) {
      setError("Debes seleccionar el tipo de documento.");
      return;
    }

    if (!nuevoArchivo) {
      setError("Debes seleccionar un archivo PDF.");
      return;
    }

    try {
      setSubiendoDocumento(true);

      setError("");
      setMensaje("");

      await agregarDocumentoProducto({
        idProd: productoSeleccionado.id_prod,
        archivo: nuevoArchivo,
        tipoDocumento: nuevoTipoDocumento,
      });

      await recargarProductoSeleccionado();

      setNuevoTipoDocumento("");
      setNuevoArchivo(null);
      setMostrarAgregarDocumento(false);

      setMensaje("Documento agregado correctamente.");
    } catch (err) {
      console.error("Error al agregar documento:", err);

      setError(err?.message || "No fue posible agregar el documento.");
    } finally {
      setSubiendoDocumento(false);
    }
  };

  const cancelarNuevoDocumento = () => {
    if (subiendoDocumento) return;

    setMostrarAgregarDocumento(false);
    setNuevoTipoDocumento("");
    setNuevoArchivo(null);
    setError("");
  };

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda =
        !texto || producto.nom_prod?.toLowerCase().includes(texto);

      const documentosProducto = producto.producto_documento ?? [];

      const total = documentosProducto.length;

      const activos = documentosProducto.filter(
        (doc) => doc.est_documento === true,
      ).length;

      const inactivos = documentosProducto.filter(
        (doc) => doc.est_documento === false,
      ).length;

      let coincideEstado = true;

      if (filtroEstado === "con_documentos") {
        coincideEstado = total > 0;
      }

      if (filtroEstado === "activos") {
        coincideEstado = activos > 0;
      }

      if (filtroEstado === "inactivos") {
        coincideEstado = inactivos > 0;
      }

      if (filtroEstado === "sin_documentos") {
        coincideEstado = total === 0;
      }

      return coincideBusqueda && coincideEstado;
    });
  }, [productos, busqueda, filtroEstado]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(fecha));
  };

  const obtenerResumenProducto = (producto) => {
    const docs = producto.producto_documento ?? [];

    const activos = docs.filter((doc) => doc.est_documento === true).length;

    const inactivos = docs.filter((doc) => doc.est_documento === false).length;

    return {
      total: docs.length,
      activos,
      inactivos,
    };
  };

  return (
    <div className="documentos-productos-page">
      <div className="documentos-productos-header">
        <div>
          <h1>Gestión de documentos</h1>

          <p>Administra los documentos asociados a los productos.</p>
        </div>
      </div>

      {error && (
        <div className="documentos-alert documentos-alert-error">{error}</div>
      )}

      {mensaje && (
        <div className="documentos-alert documentos-alert-success">
          {mensaje}
        </div>
      )}

      <div className="documentos-filtros">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="con_documentos">Productos con documentos</option>

          <option value="activos">Con documentos habilitados</option>

          <option value="inactivos">Con documentos deshabilitados</option>

          <option value="sin_documentos">Productos sin documentos</option>
        </select>
      </div>

      <div className="documentos-layout">
        <section className="documentos-productos-listado">
          <h2>Productos</h2>

          {cargandoProductos ? (
            <p>Cargando productos...</p>
          ) : productosFiltrados.length === 0 ? (
            <div className="documentos-vacio">
              No se encontraron productos con documentos.
            </div>
          ) : (
            <div className="documentos-productos-items">
              {productosFiltrados.map((producto) => {
                const resumen = obtenerResumenProducto(producto);

                const seleccionado =
                  productoSeleccionado?.id_prod === producto.id_prod;

                return (
                  <button
                    key={producto.id_prod}
                    type="button"
                    className={`documentos-producto-item ${
                      seleccionado ? "seleccionado" : ""
                    }`}
                    onClick={() => seleccionarProducto(producto)}
                  >
                    <div className="documentos-producto-info">
                      <strong>{producto.nom_prod}</strong>

                      <span>
                        {resumen.total}{" "}
                        {resumen.total === 1 ? "documento" : "documentos"}
                      </span>
                    </div>

                    <div className="documentos-producto-estados">
                      <span className="estado-activo">
                        {resumen.activos} habilitados
                      </span>

                      <span className="estado-inactivo">
                        {resumen.inactivos} deshabilitados
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* DETALLE DEL PRODUCTO */}
        <section className="documentos-detalle">
          {!productoSeleccionado ? (
            <div className="documentos-vacio">
              Selecciona un producto para visualizar sus documentos.
            </div>
          ) : (
            <>
              <div className="documentos-detalle-header">
                <div>
                  <h2>{productoSeleccionado.nom_prod}</h2>

                  <p>Documentos asociados al producto</p>
                </div>

                <button
                  type="button"
                  className="documentos-btn-agregar"
                  onClick={() => {
                    setMostrarAgregarDocumento(!mostrarAgregarDocumento);

                    setError("");
                    setMensaje("");
                  }}
                >
                  + Agregar documento
                </button>
              </div>

              {/* FORMULARIO NUEVO DOCUMENTO */}
              {mostrarAgregarDocumento && (
                <form
                  className="documentos-form-agregar"
                  onSubmit={guardarNuevoDocumento}
                >
                  <div className="documentos-form-grupo">
                    <label>Tipo de documento</label>

                    <select
                      value={nuevoTipoDocumento}
                      onChange={(e) => setNuevoTipoDocumento(e.target.value)}
                      disabled={subiendoDocumento}
                    >
                      <option value="">Seleccionar tipo</option>

                      <option value="ficha_tecnica">Ficha técnica</option>

                      <option value="hoja_seguridad">Hoja de seguridad</option>

                      <option value="certificado">Certificado</option>

                      <option value="manual">Manual</option>

                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div className="documentos-form-grupo">
                    <label>Archivo PDF</label>

                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      disabled={subiendoDocumento}
                      onChange={(e) =>
                        setNuevoArchivo(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>

                  <div className="documentos-form-acciones">
                    <button
                      type="button"
                      className="documentos-btn-cancelar"
                      disabled={subiendoDocumento}
                      onClick={cancelarNuevoDocumento}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="documentos-btn-guardar"
                      disabled={subiendoDocumento}
                    >
                      {subiendoDocumento ? "Subiendo..." : "Agregar documento"}
                    </button>
                  </div>
                </form>
              )}

              {/* DOCUMENTOS */}
              {cargandoDocumentos ? (
                <p>Cargando documentos...</p>
              ) : documentos.length === 0 ? (
                <div className="documentos-vacio">
                  Este producto no posee documentos.
                </div>
              ) : (
                <div className="documentos-tabla-contenedor">
                  <table className="documentos-tabla">
                    <thead>
                      <tr>
                        <th>Documento</th>

                        <th>Tipo</th>

                        <th>Creado</th>

                        <th>Última actualización</th>

                        <th>Estado</th>

                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {documentos.map((documento) => (
                        <tr key={documento.id_documento}>
                          <td>{documento.nombre_documento}</td>

                          <td>{documento.tipo_documento}</td>

                          <td>{formatearFecha(documento.created_at)}</td>

                          <td>{formatearFecha(documento.ultima_act_doc)}</td>

                          <td>
                            <span
                              className={
                                documento.est_documento
                                  ? "documento-estado habilitado"
                                  : "documento-estado deshabilitado"
                              }
                            >
                              {documento.est_documento
                                ? "Habilitado"
                                : "Deshabilitado"}
                            </span>
                          </td>

                          <td>
                            <div className="documentos-acciones">
                              <button
                                type="button"
                                onClick={() => verDocumento(documento)}
                              >
                                Ver
                              </button>

                              <button
                                type="button"
                                disabled={
                                  procesandoDocumento === documento.id_documento
                                }
                                onClick={() =>
                                  actualizarEstadoDocumento(documento)
                                }
                              >
                                {procesandoDocumento === documento.id_documento
                                  ? "Procesando..."
                                  : documento.est_documento
                                    ? "Deshabilitar"
                                    : "Habilitar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default DocumentosProductos;
