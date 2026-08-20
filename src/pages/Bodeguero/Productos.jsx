import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

import BodegueroHeader from "./components/BodegueroHeader";
import ProductoFormBodeguero from "./components/ProductoFormBodeguero";
import ProductTable from "../../components/productos/ProductTable";

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
    ]);

    const error =
      resultadoFamilias.error ||
      resultadoSubcategorias.error ||
      resultadoMarcas.error ||
      resultadoUnidades.error;

    if (error) throw error;

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

    if (error) throw error;

    const normalizados = (data ?? []).map((producto) => ({
      ...producto,

      producto_documento: Array.isArray(producto.producto_documento)
        ? producto.producto_documento
        : producto.producto_documento
          ? [producto.producto_documento]
          : [],
    }));

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

  async function guardarDatosProducto(datosProducto, idProducto = null) {
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
  ) {
    const rutaNueva = await subirImagenProducto(idProducto, archivo);

    try {
      const { error } = await supabase.rpc("actualizar_imagen_producto", {
        p_id_prod: idProducto,
        p_imagen_url: rutaNueva,
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
        await guardarImagenProducto(idProducto, imagen);
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

    const { datosProducto, imagen, documentosPdf } =
      separarArchivos(datosFormulario);

    try {
      const idProducto = await guardarDatosProducto(
        datosProducto,
        productoEditando.id_prod,
      );

      if (imagen) {
        await guardarImagenProducto(
          idProducto,
          imagen,
          productoEditando.imagen_url,
        );
      }

      if (documentosPdf.length > 0) {
        await guardarDocumentosProducto(idProducto, documentosPdf);
      }

      cerrarFormulario();

      setVersionImagenes(Date.now());

      await cargarProductos();

      setMensajeExito(
        "El producto fue actualizado y quedó pendiente de una nueva revisión.",
      );
    } catch (error) {
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
