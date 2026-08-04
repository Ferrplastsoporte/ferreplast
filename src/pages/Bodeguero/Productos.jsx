import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import ProductoFormBodeguero from "./components/ProductoFormBodeguero";
import ProductTable from "../../components/productos/ProductTable";

import "./css/bodeguero.css";
import "./css/productos-bodeguero.css";

const BUCKET_IMAGENES = "imagenes_productos";
const BUCKET_DOCUMENTOS = "producto-documentos";

function BodegueroProductos() {
  const [productos, setProductos] = useState([]);

  const [familias, setFamilias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);

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
    ] = await Promise.all([
      supabase
        .from("familia")
        .select(
          `
          id_familia,
          nom_familia
        `,
        )
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
    ]);

    const error =
      resultadoFamilias.error ||
      resultadoSubcategorias.error ||
      resultadoMarcas.error ||
      resultadoUnidades.error;

    if (error) {
      throw error;
    }

    setFamilias(resultadoFamilias.data ?? []);

    setSubcategorias(resultadoSubcategorias.data ?? []);

    setMarcas(resultadoMarcas.data ?? []);

    setUnidades(resultadoUnidades.data ?? []);
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
        )
      `,
      )
      .order("created_prod", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const productosNormalizados = (data ?? []).map((producto) => ({
      ...producto,

      producto_documento: Array.isArray(producto.producto_documento)
        ? producto.producto_documento
        : producto.producto_documento
          ? [producto.producto_documento]
          : [],
    }));

    setProductos(productosNormalizados);
  }

  function obtenerUrlImagen(rutaImagen) {
    if (!rutaImagen) {
      return "";
    }

    const separador = rutaImagen.includes("?") ? "&" : "?";

    if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
      return `${rutaImagen}${separador}v=${versionImagenes}`;
    }

    const { data } = supabase.storage
      .from(BUCKET_IMAGENES)
      .getPublicUrl(rutaImagen);

    return `${data.publicUrl}?v=${versionImagenes}`;
  }

  function obtenerExtensionImagen(archivo) {
    const extensionOriginal = archivo.name.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "webp"].includes(extensionOriginal)) {
      return extensionOriginal === "jpeg" ? "jpg" : extensionOriginal;
    }

    switch (archivo.type) {
      case "image/png":
        return "png";

      case "image/webp":
        return "webp";

      default:
        return "jpg";
    }
  }

  function limpiarNombreArchivo(nombre = "") {
    return String(nombre)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_+/g, "_");
  }

  function crearIdentificadorArchivo() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }

    return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  async function subirImagenProducto(idProducto, archivo, rutaAnterior = null) {
    const extension = obtenerExtensionImagen(archivo);

    const rutaNueva = `producto/${idProducto}/imagen.${extension}`;

    if (
      rutaAnterior &&
      rutaAnterior !== rutaNueva &&
      !rutaAnterior.startsWith("http")
    ) {
      const { error: errorEliminar } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .remove([rutaAnterior]);

      if (errorEliminar) {
        console.warn(
          "No fue posible eliminar la imagen anterior:",
          errorEliminar,
        );
      }
    }

    const { error } = await supabase.storage
      .from(BUCKET_IMAGENES)
      .upload(rutaNueva, archivo, {
        upsert: true,
        cacheControl: "0",
        contentType: archivo.type,
      });

    if (error) {
      throw error;
    }

    return rutaNueva;
  }

  async function subirDocumentoProducto(idProducto, archivo) {
    const nombreSeguro = limpiarNombreArchivo(archivo.name);

    const identificador = crearIdentificadorArchivo();

    const rutaDocumento = `producto/${idProducto}/${identificador}_${nombreSeguro}`;

    const { error } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .upload(rutaDocumento, archivo, {
        upsert: false,
        cacheControl: "3600",
        contentType: "application/pdf",
      });

    if (error) {
      throw error;
    }

    return rutaDocumento;
  }

  async function guardarDocumentosProducto(idProducto, archivos = []) {
    for (const archivo of archivos) {
      let rutaDocumento = null;

      try {
        rutaDocumento = await subirDocumentoProducto(idProducto, archivo);

        const { error } = await supabase.from("producto_documento").insert({
          id_prod: idProducto,
          nombre_documento: archivo.name,
          tipo_documento: "otro",
          archivo_path: rutaDocumento,
          est_documento: true,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        /*
         * Si el archivo alcanzó a subirse,
         * pero falló el registro en la
         * tabla, se intenta limpiar Storage.
         */
        if (rutaDocumento) {
          const { error: errorLimpieza } = await supabase.storage
            .from(BUCKET_DOCUMENTOS)
            .remove([rutaDocumento]);

          if (errorLimpieza) {
            console.warn(
              "No fue posible limpiar el documento luego del error:",
              errorLimpieza,
            );
          }
        }

        throw error;
      }
    }
  }

  function separarArchivos(datosFormulario) {
    const { imagen, documentosPdf, ...datosProducto } = datosFormulario;

    return {
      datosProducto,
      imagen,
      documentosPdf: Array.isArray(documentosPdf) ? documentosPdf : [],
    };
  }

  async function crearProducto(datosFormulario) {
    if (guardando) {
      return;
    }

    setGuardando(true);
    setMensajeError("");
    setMensajeExito("");

    const { datosProducto, imagen, documentosPdf } =
      separarArchivos(datosFormulario);

    try {
      /*
       * No enviamos:
       * created_prod
       * ultima_act_prod
       * est_prod
       *
       * Supabase utilizará los defaults
       * configurados en la tabla.
       */
      const { data: productoCreado, error } = await supabase
        .from("producto")
        .insert(datosProducto)
        .select(
          `
          id_prod,
          imagen_url
        `,
        )
        .single();

      if (error) {
        throw error;
      }

      if (!productoCreado) {
        throw new Error("No fue posible obtener el producto creado.");
      }

      if (imagen) {
        const rutaImagen = await subirImagenProducto(
          productoCreado.id_prod,
          imagen,
        );

        const { error: errorImagen } = await supabase
          .from("producto")
          .update({
            imagen_url: rutaImagen,
          })
          .eq("id_prod", productoCreado.id_prod);

        if (errorImagen) {
          throw errorImagen;
        }
      }

      if (documentosPdf.length > 0) {
        await guardarDocumentosProducto(productoCreado.id_prod, documentosPdf);
      }

      cerrarFormulario();

      setVersionImagenes(Date.now());

      await cargarProductos();

      setMensajeExito("El producto fue creado y quedó pendiente de revisión.");
    } catch (error) {
      console.error("Error al crear el producto:", error);

      if (error?.code === "23505") {
        setMensajeError("Ya existe un producto con los datos ingresados.");
      } else if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError(
          "No tienes permisos para crear el producto o cargar sus archivos.",
        );
      } else {
        setMensajeError(error?.message || "No fue posible crear el producto.");
      }

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

    const { datosProducto, imagen, documentosPdf } =
      separarArchivos(datosFormulario);

    try {
      /*
       * Cada edición vuelve a dejar el
       * producto en estado Pendiente.
       *
       * 1 = Pendiente
       */
      const { error } = await supabase
        .from("producto")
        .update({
          ...datosProducto,
          est_prod: 1,
        })
        .eq("id_prod", productoEditando.id_prod);

      if (error) {
        throw error;
      }

      if (imagen) {
        const rutaImagen = await subirImagenProducto(
          productoEditando.id_prod,
          imagen,
          productoEditando.imagen_url,
        );

        const { error: errorImagen } = await supabase
          .from("producto")
          .update({
            imagen_url: rutaImagen,
            est_prod: 1,
          })
          .eq("id_prod", productoEditando.id_prod);

        if (errorImagen) {
          throw errorImagen;
        }
      }

      /*
       * Los PDF nuevos se agregan.
       * No reemplazan los documentos
       * que el producto ya tenía.
       */
      if (documentosPdf.length > 0) {
        await guardarDocumentosProducto(
          productoEditando.id_prod,
          documentosPdf,
        );
      }

      cerrarFormulario();

      setVersionImagenes(Date.now());

      await cargarProductos();

      setMensajeExito(
        "El producto fue actualizado y quedó pendiente de una nueva revisión.",
      );
    } catch (error) {
      console.error("Error al actualizar el producto:", error);

      if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError(
          "No tienes permisos para actualizar el producto o cargar sus documentos.",
        );
      } else {
        setMensajeError(
          error?.message || "No fue posible actualizar el producto.",
        );
      }

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
    if (desactivando) {
      return;
    }

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
      const { error } = await supabase
        .from("producto")
        .update({
          /*
           * 3 = No disponible
           */
          est_prod: 3,
        })
        .eq("id_prod", productoPorDesactivar.id_prod);

      if (error) {
        throw error;
      }

      setProductoPorDesactivar(null);

      await cargarProductos();

      setMensajeExito("El producto fue marcado como no disponible.");
    } catch (error) {
      console.error("Error al deshabilitar el producto:", error);

      if (error?.message?.toLowerCase().includes("row-level security")) {
        setMensajeError("No tienes permisos para deshabilitar productos.");
      } else {
        setMensajeError(
          error?.message ||
            "No fue posible marcar el producto como no disponible.",
        );
      }
    } finally {
      setDesactivando(false);
    }
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

      {mostrarFormulario && (
        <ProductoFormBodeguero
          productoInicial={productoEditando}
          familias={familias}
          subcategorias={subcategorias}
          marcas={marcas}
          unidades={unidades}
          imagenActualUrl={
            productoEditando?.imagen_url
              ? obtenerUrlImagen(productoEditando.imagen_url)
              : ""
          }
          documentoActual={documentosActuales}
          onGuardar={productoEditando ? actualizarProducto : crearProducto}
          onCancelar={cerrarFormulario}
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

      <ProductTable
        productos={productos}
        onEditar={abrirEdicionProducto}
        onDesactivar={solicitarDesactivacion}
        modo="bodeguero"
      />
    </section>
  );
}

export default BodegueroProductos;
