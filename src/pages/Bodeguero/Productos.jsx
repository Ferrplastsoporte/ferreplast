import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import ProductoFormBodeguero from "./components/ProductoFormBodeguero";
import TablaProductos from "../../components/productos/TablaProductos";

import {
  obtenerUrlImagenProducto,
  subirImagenProducto,
  eliminarImagenProducto,
  subirDocumentoProducto,
  eliminarDocumentoProducto,
} from "../../services/productoStorageService";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";

const TIPOS_DOCUMENTO_VALIDOS = [
  "ficha_tecnica",
  "hoja_seguridad",
  "certificado",
  "manual",
  "otro",
];

function BodegueroProductos() {
  const [productos, setProductos] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [tiposPeligrosidad, setTiposPeligrosidad] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [documentosActuales, setDocumentosActuales] = useState([]);
  const [versionImagenes, setVersionImagenes] = useState(Date.now());
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [productoPorDesactivar, setProductoPorDesactivar] = useState(null);
  const [desactivando, setDesactivando] = useState(false);
  const [productoPorReactivar, setProductoPorReactivar] = useState(null);
  const [reactivando, setReactivando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFamilia, setFiltroFamilia] = useState("todas");
  const [filtroMarca, setFiltroMarca] = useState("todas");

  useEffect(() => {
    cargarVista();
  }, []);

  async function cargarVista() {
    setCargando(true);
    setMensajeError("");

    try {
      await Promise.all([cargarProductos(), cargarCatalogos()]);
    } catch (error) {
      console.error("Error al cargar el módulo de productos:", error);

      setMensajeError(
        "No fue posible cargar la información del módulo de productos.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarCatalogos() {
    const [
      resultadoFamilias,
      resultadoSubcategorias,
      resultadoMarcas,
      resultadoUnidades,

      // NUEVO
      resultadoPeligrosidades,
    ] = await Promise.all([
      supabase
        .from("familia")
        .select("id_familia, nom_familia")
        .order("nom_familia", {
          ascending: true,
        }),

      supabase
        .from("subcategoria")
        .select(
          `
          id_subcategoria,
          nom_subcategoria,
          id_familia
        `,
        )
        .order("nom_subcategoria", {
          ascending: true,
        }),

      supabase
        .from("marca_producto")
        .select(
          `
          id_marca,
          nom_marca,
          est_marca
        `,
        )
        .eq("est_marca", true)
        .order("nom_marca", {
          ascending: true,
        }),

      supabase
        .from("unidad_medida")
        .select(
          `
          id_und_medida,
          nom_und_medida
        `,
        )
        .order("nom_und_medida", {
          ascending: true,
        }),

      // NUEVO
      supabase
        .from("tipo_peligrosidad")
        .select(
          `
          id_peligrosidad,
          nom_peligrosidad
        `,
        )
        .order("nom_peligrosidad", {
          ascending: true,
        }),
    ]);

    const error =
      resultadoFamilias.error ||
      resultadoSubcategorias.error ||
      resultadoMarcas.error ||
      resultadoUnidades.error ||
      resultadoPeligrosidades.error;

    if (error) throw error;

    setFamilias(resultadoFamilias.data ?? []);
    setSubcategorias(resultadoSubcategorias.data ?? []);
    setMarcas(resultadoMarcas.data ?? []);
    setUnidades(resultadoUnidades.data ?? []);

    // NUEVO
    setTiposPeligrosidad(resultadoPeligrosidades.data ?? []);
  }

  async function cargarProductos() {
    const { data, error } = await supabase
      .from("producto")
      .select(
        `
        id_prod,
        nom_prod,
        desc_prod,
        detalle_prod,
        precio_prod,
        precio_act,
        imagen_url,
        created_prod,
        est_prod,
        id_und_medida,
        peso_prod,
        id_subcategoria,
        color_prod,
        id_marca,
        ultima_act_prod,
        stock_prod,

        estado_producto (
          id_est_prod,
          nom_est_prod
        ),

        unidad_medida (
          id_und_medida,
          nom_und_medida
        ),

        marca_producto (
          id_marca,
          nom_marca
        ),

        subcategoria (
          id_subcategoria,
          nom_subcategoria,
          id_familia,

          familia (
            id_familia,
            nom_familia
          )
        ),

        producto_documento (
          id_documento,
          nombre_documento,
          tipo_documento,
          archivo_path,
          est_documento,
          created_at
        ),

        producto_peligrosidad (
          id_peligrosidad
        )
      `,
      )
      .order("created_prod", {
        ascending: false,
      });

    if (error) throw error;

    const normalizados = (data ?? []).map((producto) => {
      const relacionesPeligrosidad = Array.isArray(
        producto.producto_peligrosidad,
      )
        ? producto.producto_peligrosidad
        : producto.producto_peligrosidad
          ? [producto.producto_peligrosidad]
          : [];

      return {
        ...producto,

        producto_documento: Array.isArray(producto.producto_documento)
          ? producto.producto_documento
          : producto.producto_documento
            ? [producto.producto_documento]
            : [],
        peligrosidades: relacionesPeligrosidad
          .map((relacion) => Number(relacion.id_peligrosidad))
          .filter((id) => Number.isInteger(id) && id > 0),
      };
    });

    setProductos(normalizados);
  }

  function separarArchivos(datosFormulario) {
    const { imagen, documentosPdf, ...datosProducto } = datosFormulario;

    return {
      datosProducto,
      imagen,
      documentosPdf: Array.isArray(documentosPdf) ? documentosPdf : [],
    };
  }

  function validarDocumento(documento) {
    if (!documento?.archivo) {
      throw new Error(
        "Uno de los documentos seleccionados no contiene un archivo válido.",
      );
    }
    if (documento.archivo.type !== "application/pdf") {
      throw new Error(
        `El archivo "${documento.archivo.name}" no está en formato PDF.`,
      );
    }
    if (!TIPOS_DOCUMENTO_VALIDOS.includes(documento.tipoDocumento)) {
      throw new Error(
        `Debes seleccionar un tipo válido para "${documento.archivo.name}".`,
      );
    }
  }

  async function guardarDatosProducto(
    datosProducto,
    idProducto = null,
    imagenUrl = null,
  ) {
    const peligrosidades = Array.isArray(datosProducto.peligrosidades)
      ? datosProducto.peligrosidades
      : [];

    const { data, error } = await supabase.rpc("guardar_producto", {
      p_id_prod: idProducto,
      p_nom_prod: datosProducto.nom_prod,
      p_desc_prod: datosProducto.desc_prod,
      p_detalle_prod: datosProducto.detalle_prod,
      p_precio_prod: datosProducto.precio_prod,
      p_precio_act: datosProducto.precio_act,
      p_stock_prod: datosProducto.stock_prod ?? null,
      p_id_subcategoria: datosProducto.id_subcategoria,
      p_id_und_medida: datosProducto.id_und_medida,
      p_id_marca: datosProducto.id_marca,
      p_color_prod: datosProducto.color_prod,
      p_peso_prod: datosProducto.peso_prod,
      p_imagen_url: imagenUrl,
      p_peligrosidades: peligrosidades,
    });

    if (error) throw error;

    if (!data) {
      throw new Error("No fue posible obtener el identificador del producto.");
    }

    return data;
  }

  async function guardarImagenProducto(
    idProducto,
    archivo,
    rutaAnterior = null,
    esImagenInicial = false,
  ) {
    const rutaNueva = await subirImagenProducto(idProducto, archivo);

    try {
      const { error } = await supabase.rpc("actualizar_imagen_producto", {
        p_id_prod: idProducto,
        p_imagen_url: rutaNueva,
        p_es_imagen_inicial: esImagenInicial,
      });

      if (error) throw error;

      if (rutaAnterior && rutaAnterior !== rutaNueva) {
        await eliminarImagenProducto(rutaAnterior);
      }

      return rutaNueva;
    } catch (error) {
      if (!rutaAnterior || rutaAnterior !== rutaNueva) {
        await eliminarImagenProducto(rutaNueva);
      }

      throw error;
    }
  }

  async function guardarDocumentosProducto(idProducto, documentos = []) {
    for (const documento of documentos) {
      validarDocumento(documento);

      const archivo = documento.archivo;

      let rutaDocumento = null;

      try {
        rutaDocumento = await subirDocumentoProducto(idProducto, archivo);

        const { error } = await supabase.rpc("guardar_documento_producto", {
          p_id_prod: idProducto,

          p_nombre_documento: archivo.name,

          p_tipo_documento: documento.tipoDocumento,

          p_archivo_path: rutaDocumento,
        });

        if (error) throw error;
      } catch (error) {
        if (rutaDocumento) {
          await eliminarDocumentoProducto(rutaDocumento);
        }

        throw error;
      }
    }
  }

  async function crearProducto(datosFormulario) {
    if (guardando) return;

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    const { datosProducto, imagen, documentosPdf } =
      separarArchivos(datosFormulario);

    try {
      const idProducto = await guardarDatosProducto(datosProducto);

      if (imagen) {
        await guardarImagenProducto(idProducto, imagen, null, true);
      }

      if (documentosPdf.length > 0) {
        await guardarDocumentosProducto(idProducto, documentosPdf);
      }

      cerrarFormulario();

      setVersionImagenes(Date.now());

      await cargarProductos();

      setMensajeExito("El producto fue creado y quedó pendiente de revisión.");
    } catch (error) {
      console.error("Error al crear el producto:", error);

      setMensajeError(error?.message || "No fue posible crear el producto.");

      throw error;
    } finally {
      setGuardando(false);
    }
  }

  async function actualizarProducto(datosFormulario) {
    if (guardando || !productoEditando) {
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    const { datosProducto, imagen } = separarArchivos(datosFormulario);

    let rutaImagenNueva = null;

    try {
      if (imagen) {
        rutaImagenNueva = await subirImagenProducto(
          productoEditando.id_prod,
          imagen,
        );
      }
      await guardarDatosProducto(
        datosProducto,
        productoEditando.id_prod,
        rutaImagenNueva,
      );

      if (
        rutaImagenNueva &&
        productoEditando.imagen_url &&
        productoEditando.imagen_url !== rutaImagenNueva
      ) {
        await eliminarImagenProducto(productoEditando.imagen_url);
      }

      cerrarFormulario();

      setVersionImagenes(Date.now());

      await cargarProductos();

      setMensajeExito(
        "El producto fue actualizado y quedó pendiente de una nueva revisión.",
      );
    } catch (error) {
      if (rutaImagenNueva) {
        await eliminarImagenProducto(rutaImagenNueva);
      }

      console.error("Error al actualizar el producto:", error);

      setMensajeError(
        error?.message || "No fue posible actualizar el producto.",
      );

      throw error;
    } finally {
      setGuardando(false);
    }
  }

  function abrirNuevoProducto() {
    setProductoEditando(null);
    setDocumentosActuales([]);

    setMensajeError("");
    setMensajeExito("");

    setMostrarFormulario(true);
  }

  function abrirEdicionProducto(producto) {
    const documentosProducto = Array.isArray(producto.producto_documento)
      ? producto.producto_documento
      : producto.producto_documento
        ? [producto.producto_documento]
        : [];

    const documentosActivos = documentosProducto.filter(
      (documento) => documento.est_documento !== false,
    );

    setProductoEditando(producto);
    setDocumentosActuales(documentosActivos);

    setMensajeError("");
    setMensajeExito("");

    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
    setProductoEditando(null);
    setDocumentosActuales([]);
  }

  function solicitarDesactivacion(producto) {
    setProductoPorDesactivar(producto);

    setMensajeError("");
    setMensajeExito("");
  }

  function cancelarDesactivacion() {
    if (desactivando) return;

    setProductoPorDesactivar(null);
  }

  async function confirmarDesactivacion() {
    if (!productoPorDesactivar || desactivando) {
      return;
    }

    setDesactivando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const { error } = await supabase.rpc("desactivar_producto", {
        p_id_prod: productoPorDesactivar.id_prod,
      });

      if (error) throw error;

      setProductoPorDesactivar(null);

      await cargarProductos();

      setMensajeExito("El producto fue marcado como no disponible.");
    } catch (error) {
      console.error("Error al deshabilitar el producto:", error);

      setMensajeError(
        error?.message ||
          "No fue posible marcar el producto como no disponible.",
      );
    } finally {
      setDesactivando(false);
    }
  }

  function solicitarReactivacion(producto) {
    setProductoPorReactivar(producto);
    setMensajeError("");
    setMensajeExito("");
  }

  function cancelarReactivacion() {
    if (reactivando) return;

    setProductoPorReactivar(null);
  }

  async function confirmarReactivacion() {
    if (!productoPorReactivar || reactivando) {
      return;
    }

    setReactivando(true);
    setMensajeError("");
    setMensajeExito("");

    try {
      const { data, error } = await supabase
        .from("producto")
        .update({ est_prod: 2 })
        .eq("id_prod", productoPorReactivar.id_prod)
        .eq("est_prod", 3)
        .gte("stock_prod", 1)
        .select("id_prod")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "El producto ya no cumple las condiciones para ser reactivado.",
        );
      }

      const nombreProducto = productoPorReactivar.nom_prod;

      setProductoPorReactivar(null);
      await cargarProductos();

      setMensajeExito(`El producto "${nombreProducto}" fue reactivado.`);
    } catch (error) {
      console.error("Error al reactivar el producto:", error);

      setMensajeError(
        error?.message ||
          "No fue posible reactivar el producto. Comprueba su estado y stock.",
      );
    } finally {
      setReactivando(false);
    }
  }

  const marcasDisponiblesEnTabla = useMemo(() => {
    const marcasPorId = new Map();

    productos.forEach((producto) => {
      const marca = producto.marca_producto;

      if (marca?.id_marca) {
        marcasPorId.set(marca.id_marca, marca);
      }
    });

    return [...marcasPorId.values()].sort((marcaA, marcaB) =>
      (marcaA.nom_marca || "").localeCompare(marcaB.nom_marca || "", "es-CL"),
    );
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase("es-CL");

    return productos.filter((producto) => {
      const coincideBusqueda =
        !texto ||
        producto.nom_prod?.toLocaleLowerCase("es-CL").includes(texto) ||
        String(producto.id_prod).includes(texto);

      const coincideEstado =
        filtroEstado === "todos" ||
        Number(producto.est_prod) === Number(filtroEstado);

      const coincideFamilia =
        filtroFamilia === "todas" ||
        Number(producto.subcategoria?.id_familia) === Number(filtroFamilia);

      const coincideMarca =
        filtroMarca === "todas" ||
        Number(producto.id_marca) === Number(filtroMarca);

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideFamilia &&
        coincideMarca
      );
    });
  }, [productos, busqueda, filtroEstado, filtroFamilia, filtroMarca]);

  const hayFiltrosActivos =
    busqueda.trim() ||
    filtroEstado !== "todos" ||
    filtroFamilia !== "todas" ||
    filtroMarca !== "todas";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroFamilia("todas");
    setFiltroMarca("todas");
  }

  if (cargando) {
    return (
      <section className="bodeguero-page productos-page">
        <p className="bodeguero-loading">Cargando productos...</p>
      </section>
    );
  }

  return (
    <section className="bodeguero-page productos-page">
      <BodegueroHeader
        titulo="Gestión de productos"
        descripcion="Crea, actualiza y administra los productos disponibles en el catálogo."
      />

      <div className="productos-toolbar">
        <button
          type="button"
          className="btn-add"
          onClick={abrirNuevoProducto}
          disabled={guardando}
        >
          Nuevo producto
        </button>
      </div>

      {mensajeExito && (
        <p
          className="bodeguero-message bodeguero-message--success"
          role="status"
        >
          {mensajeExito}
        </p>
      )}

      {mensajeError && (
        <div
          className="bodeguero-message bodeguero-message--error"
          role="alert"
        >
          <p>{mensajeError}</p>

          <button
            type="button"
            className="productos-retry"
            onClick={cargarVista}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="productos-filtros" aria-label="Filtros de productos">
        <div className="productos-filtros__field productos-filtros__search">
          <label htmlFor="buscarProductoBodega">Buscar producto</label>

          <input
            id="buscarProductoBodega"
            type="search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar por nombre o ID..."
          />
        </div>

        <div className="productos-filtros__field">
          <label htmlFor="filtroEstadoProducto">Estado</label>

          <select
            id="filtroEstadoProducto"
            value={filtroEstado}
            onChange={(evento) => setFiltroEstado(evento.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="1">Pendientes</option>
            <option value="2">Activos</option>
            <option value="3">No disponibles</option>
            <option value="4">Rechazados</option>
          </select>
        </div>

        <div className="productos-filtros__field">
          <label htmlFor="filtroFamiliaProducto">Familia</label>

          <select
            id="filtroFamiliaProducto"
            value={filtroFamilia}
            onChange={(evento) => setFiltroFamilia(evento.target.value)}
          >
            <option value="todas">Todas las familias</option>

            {familias.map((familia) => (
              <option key={familia.id_familia} value={familia.id_familia}>
                {familia.nom_familia}
              </option>
            ))}
          </select>
        </div>

        <div className="productos-filtros__field">
          <label htmlFor="filtroMarcaProducto">Marca</label>

          <select
            id="filtroMarcaProducto"
            value={filtroMarca}
            onChange={(evento) => setFiltroMarca(evento.target.value)}
          >
            <option value="todas">Todas las marcas</option>

            {marcasDisponiblesEnTabla.map((marca) => (
              <option key={marca.id_marca} value={marca.id_marca}>
                {marca.nom_marca}
              </option>
            ))}
          </select>
        </div>

        <div className="productos-filtros__footer">
          <span>
            Mostrando <strong>{productosFiltrados.length}</strong> de{" "}
            <strong>{productos.length}</strong> productos
          </span>

          {hayFiltrosActivos && (
            <button type="button" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {mostrarFormulario && (
        <ProductoFormBodeguero
          productoInicial={productoEditando}
          familias={familias}
          subcategorias={subcategorias}
          marcas={marcas}
          unidades={unidades}
          // NUEVO
          tiposPeligrosidad={tiposPeligrosidad}
          imagenActualUrl={
            productoEditando?.imagen_url
              ? obtenerUrlImagenProducto(
                  productoEditando.imagen_url,
                  versionImagenes,
                )
              : ""
          }
          documentoActual={documentosActuales}
          onGuardar={productoEditando ? actualizarProducto : crearProducto}
          onCancelar={cerrarFormulario}
          esEdicion={Boolean(productoEditando)}
        />
      )}

      {productoPorDesactivar && (
        <div
          className="productos-modal-backdrop"
          role="presentation"
          onMouseDown={cancelarDesactivacion}
        >
          <div
            className="productos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloDesactivarProducto"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2 id="tituloDesactivarProducto">Deshabilitar producto</h2>

            <p>
              ¿Deseas marcar <strong>{productoPorDesactivar.nom_prod}</strong>{" "}
              como no disponible?
            </p>

            <p className="productos-modal__note">
              El producto dejará de estar disponible para los clientes, pero
              conservará su información, documentos y trazabilidad.
            </p>

            <div className="productos-modal__actions">
              <button
                type="button"
                className="productos-modal__confirm"
                onClick={confirmarDesactivacion}
                disabled={desactivando}
              >
                {desactivando ? "Deshabilitando..." : "Deshabilitar"}
              </button>

              <button
                type="button"
                className="productos-modal__cancel"
                onClick={cancelarDesactivacion}
                disabled={desactivando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {productoPorReactivar && (
        <div
          className="productos-modal-backdrop"
          role="presentation"
          onMouseDown={cancelarReactivacion}
        >
          <div
            className="productos-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tituloReactivarProducto"
            onMouseDown={(evento) => evento.stopPropagation()}
          >
            <h2 id="tituloReactivarProducto">Reactivar producto</h2>

            <p>
              ¿Deseas volver a activar{" "}
              <strong>{productoPorReactivar.nom_prod}</strong>?
            </p>

            <p className="productos-modal__note productos-modal__note--success">
              El producto volverá a estar disponible para los clientes porque
              cuenta con {productoPorReactivar.stock_prod} unidades en stock.
            </p>

            <div className="productos-modal__actions">
              <button
                type="button"
                className="productos-modal__confirm productos-modal__confirm--reactivate"
                onClick={confirmarReactivacion}
                disabled={reactivando}
              >
                {reactivando ? "Reactivando..." : "Reactivar"}
              </button>

              <button
                type="button"
                className="productos-modal__cancel"
                onClick={cancelarReactivacion}
                disabled={reactivando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <TablaProductos
        productos={productosFiltrados}
        onEditar={abrirEdicionProducto}
        onDesactivar={solicitarDesactivacion}
        onReactivar={solicitarReactivacion}
        mensajeVacio={
          productos.length === 0
            ? "No hay productos registrados."
            : "No hay productos que coincidan con los filtros seleccionados."
        }
        modo="bodeguero"
      />
    </section>
  );
}

export default BodegueroProductos;
