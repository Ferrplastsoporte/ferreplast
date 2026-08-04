import { useEffect, useMemo, useState } from "react";
import "../css/productos-bodeguero.css";

const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;
const TAMANO_MAXIMO_PDF = 20 * 1024 * 1024;

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const ESTADO_INICIAL = {
  nombre: "",
  descripcion: "",
  detalle: "",
  precioNormal: "",
  precioOferta: "",
  stock: "0",
  familiaId: "",
  subcategoriaId: "",
  marcaId: "",
  unidadId: "",
  color: "",
  peso: "",
};

function limpiarTexto(valor = "") {
  return String(valor)
    .replace(/[<>[\]{}]/g, "")
    .replace(/\s{2,}/g, " ");
}

function normalizarNumeroDecimal(valor = "") {
  return String(valor).replace(",", ".");
}

function ProductoFormBodeguero({
  productoInicial = null,
  familias = [],
  subcategorias = [],
  marcas = [],
  unidades = [],
  imagenActualUrl = "",
  documentoActual = [],
  onGuardar,
  onCancelar,
}) {
  const [formulario, setFormulario] = useState(ESTADO_INICIAL);

  const [imagen, setImagen] = useState(null);

  const [documentosPdf, setDocumentosPdf] = useState([]);

  const [vistaPreviaImagen, setVistaPreviaImagen] = useState("");

  const [mensajeError, setMensajeError] = useState("");

  const [guardando, setGuardando] = useState(false);

  const editando = Boolean(productoInicial);

  const documentosActuales = useMemo(() => {
    if (Array.isArray(documentoActual)) {
      return documentoActual;
    }

    return documentoActual ? [documentoActual] : [];
  }, [documentoActual]);

  const subcategoriasFiltradas = useMemo(() => {
    if (!formulario.familiaId) {
      return [];
    }

    return subcategorias.filter(
      (subcategoria) =>
        Number(subcategoria.id_familia) === Number(formulario.familiaId),
    );
  }, [formulario.familiaId, subcategorias]);

  useEffect(() => {
    cargarProductoInicial();
  }, [productoInicial, subcategorias, imagenActualUrl]);

  useEffect(() => {
    return () => {
      if (vistaPreviaImagen.startsWith("blob:")) {
        URL.revokeObjectURL(vistaPreviaImagen);
      }
    };
  }, [vistaPreviaImagen]);

  function cargarProductoInicial() {
    if (!productoInicial) {
      setFormulario(ESTADO_INICIAL);
      setImagen(null);
      setDocumentosPdf([]);
      setVistaPreviaImagen("");
      setMensajeError("");

      return;
    }

    const subcategoriaActual = subcategorias.find(
      (subcategoria) =>
        Number(subcategoria.id_subcategoria) ===
        Number(productoInicial.id_subcategoria),
    );

    setFormulario({
      nombre: productoInicial.nom_prod ?? "",

      descripcion: productoInicial.desc_prod ?? "",

      detalle: productoInicial.detalle_prod ?? "",

      precioNormal:
        productoInicial.precio_prod !== null &&
        productoInicial.precio_prod !== undefined
          ? String(productoInicial.precio_prod)
          : "",

      precioOferta:
        productoInicial.precio_act !== null &&
        productoInicial.precio_act !== undefined
          ? String(productoInicial.precio_act)
          : "",

      stock:
        productoInicial.stock_prod !== null &&
        productoInicial.stock_prod !== undefined
          ? String(productoInicial.stock_prod)
          : "0",

      familiaId: subcategoriaActual
        ? String(subcategoriaActual.id_familia)
        : "",

      subcategoriaId: productoInicial.id_subcategoria
        ? String(productoInicial.id_subcategoria)
        : "",

      marcaId: productoInicial.id_marca ? String(productoInicial.id_marca) : "",

      unidadId: productoInicial.id_und_medida
        ? String(productoInicial.id_und_medida)
        : "",

      color: productoInicial.color_prod ?? "",

      peso:
        productoInicial.peso_prod !== null &&
        productoInicial.peso_prod !== undefined
          ? String(productoInicial.peso_prod)
          : "",
    });

    setImagen(null);
    setDocumentosPdf([]);

    setVistaPreviaImagen(imagenActualUrl || "");

    setMensajeError("");
  }

  function actualizarCampo(campo, valor) {
    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      [campo]: valor,
    }));
  }

  function cambiarFamilia(evento) {
    const nuevaFamiliaId = evento.target.value;

    setFormulario((estadoAnterior) => ({
      ...estadoAnterior,
      familiaId: nuevaFamiliaId,
      subcategoriaId: "",
    }));
  }

  function seleccionarImagen(evento) {
    const archivo = evento.target.files?.[0] ?? null;

    setMensajeError("");

    if (!archivo) {
      setImagen(null);

      setVistaPreviaImagen(imagenActualUrl || "");

      return;
    }

    if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
      evento.target.value = "";

      setImagen(null);

      setMensajeError("La imagen debe estar en formato JPG, PNG o WEBP.");

      return;
    }

    if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
      evento.target.value = "";

      setImagen(null);

      setMensajeError("La imagen no puede superar los 10 MB.");

      return;
    }

    if (vistaPreviaImagen.startsWith("blob:")) {
      URL.revokeObjectURL(vistaPreviaImagen);
    }

    setImagen(archivo);

    setVistaPreviaImagen(URL.createObjectURL(archivo));
  }

  function seleccionarDocumentos(evento) {
    const archivos = Array.from(evento.target.files ?? []);

    setMensajeError("");

    if (archivos.length === 0) {
      setDocumentosPdf([]);

      return;
    }

    const archivoInvalido = archivos.find(
      (archivo) => archivo.type !== "application/pdf",
    );

    if (archivoInvalido) {
      evento.target.value = "";

      setDocumentosPdf([]);

      setMensajeError("Todos los documentos deben estar en formato PDF.");

      return;
    }

    const archivoDemasiadoGrande = archivos.find(
      (archivo) => archivo.size > TAMANO_MAXIMO_PDF,
    );

    if (archivoDemasiadoGrande) {
      evento.target.value = "";

      setDocumentosPdf([]);

      setMensajeError(
        `El documento "${archivoDemasiadoGrande.name}" supera los 20 MB.`,
      );

      return;
    }

    const nombresRepetidos = archivos.some(
      (archivo, indiceActual) =>
        archivos.findIndex(
          (otroArchivo) =>
            otroArchivo.name === archivo.name &&
            otroArchivo.size === archivo.size,
        ) !== indiceActual,
    );

    if (nombresRepetidos) {
      evento.target.value = "";

      setDocumentosPdf([]);

      setMensajeError(
        "No puedes seleccionar el mismo documento más de una vez.",
      );

      return;
    }

    setDocumentosPdf(archivos);
  }

  function validarFormulario() {
    const nombre = formulario.nombre.trim();

    const descripcion = formulario.descripcion.trim();

    const detalle = formulario.detalle.trim();

    const precioNormal = Number(formulario.precioNormal);

    const precioOferta =
      formulario.precioOferta === "" ? null : Number(formulario.precioOferta);

    const stock = Number(formulario.stock);

    const peso =
      formulario.peso === ""
        ? null
        : Number(normalizarNumeroDecimal(formulario.peso));

    if (nombre.length < 3) {
      return "El nombre debe tener al menos 3 caracteres.";
    }

    if (nombre.length > 120) {
      return "El nombre no puede superar los 120 caracteres.";
    }

    if (descripcion.length < 10) {
      return "La descripción debe tener al menos 10 caracteres.";
    }

    if (descripcion.length > 300) {
      return "La descripción no puede superar los 300 caracteres.";
    }

    if (detalle.length > 1000) {
      return "El detalle no puede superar los 1.000 caracteres.";
    }

    if (!Number.isInteger(precioNormal) || precioNormal <= 0) {
      return "El precio normal debe ser un número entero mayor que cero.";
    }

    if (
      precioOferta !== null &&
      (!Number.isInteger(precioOferta) || precioOferta <= 0)
    ) {
      return "El precio de oferta debe ser un número entero mayor que cero.";
    }

    if (precioOferta !== null && precioOferta >= precioNormal) {
      return "El precio de oferta debe ser menor que el precio normal.";
    }

    if (!formulario.familiaId) {
      return "Debes seleccionar una familia.";
    }

    if (!formulario.subcategoriaId) {
      return "Debes seleccionar una subcategoría.";
    }

    const subcategoriaValida = subcategoriasFiltradas.some(
      (subcategoria) =>
        Number(subcategoria.id_subcategoria) ===
        Number(formulario.subcategoriaId),
    );

    if (!subcategoriaValida) {
      return "La subcategoría seleccionada no pertenece a la familia indicada.";
    }

    if (!formulario.unidadId) {
      return "Debes seleccionar una unidad de medida.";
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return "El stock debe ser un número entero igual o mayor que cero.";
    }

    if (peso !== null && (!Number.isFinite(peso) || peso <= 0)) {
      return "El peso o contenido debe ser mayor que cero.";
    }

    return null;
  }

  function construirDatosProducto() {
    return {
      nom_prod: formulario.nombre.trim(),

      desc_prod: formulario.descripcion.trim(),

      detalle_prod: formulario.detalle.trim() || null,

      precio_prod: Number(formulario.precioNormal),

      precio_act:
        formulario.precioOferta === "" ? null : Number(formulario.precioOferta),

      stock_prod: Number(formulario.stock),

      id_subcategoria: Number(formulario.subcategoriaId),

      id_und_medida: Number(formulario.unidadId),

      id_marca: formulario.marcaId ? Number(formulario.marcaId) : null,

      color_prod: formulario.color.trim() || null,

      peso_prod:
        formulario.peso === ""
          ? null
          : Number(normalizarNumeroDecimal(formulario.peso)),

      imagen,
      documentosPdf,
    };
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();

    if (guardando) {
      return;
    }

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensajeError(errorValidacion);

      return;
    }

    setGuardando(true);
    setMensajeError("");

    try {
      await onGuardar(construirDatosProducto());
    } catch (error) {
      console.error("Error al guardar el producto:", error);

      setMensajeError(error?.message || "No fue posible guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="producto-bodega-form" onSubmit={manejarEnvio} noValidate>
      <div className="producto-bodega-form__header">
        <div>
          <h2>{editando ? "Editar producto" : "Crear producto"}</h2>

          <p>
            Completa la información comercial, técnica y de almacenamiento del
            producto.
          </p>
        </div>
      </div>

      {mensajeError && (
        <p className="bodeguero-message bodeguero-message--error" role="alert">
          {mensajeError}
        </p>
      )}

      <div className="producto-bodega-form__grid">
        <div className="producto-bodega-form__field producto-bodega-form__field--full">
          <label htmlFor="nombreProducto">Nombre del producto</label>

          <input
            id="nombreProducto"
            type="text"
            value={formulario.nombre}
            onChange={(evento) =>
              actualizarCampo("nombre", limpiarTexto(evento.target.value))
            }
            minLength={3}
            maxLength={120}
            placeholder="Ej: Kit epóxico para reparación 2 KG"
            disabled={guardando}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="producto-bodega-form__field producto-bodega-form__field--full">
          <label htmlFor="descripcionProducto">Descripción breve</label>

          <textarea
            id="descripcionProducto"
            value={formulario.descripcion}
            onChange={(evento) =>
              actualizarCampo("descripcion", limpiarTexto(evento.target.value))
            }
            minLength={10}
            maxLength={300}
            placeholder="Descripción que aparecerá en las tarjetas y el catálogo."
            disabled={guardando}
          />

          <small>Máximo 300 caracteres.</small>
        </div>

        <div className="producto-bodega-form__field producto-bodega-form__field--full">
          <label htmlFor="detalleProducto">Detalle adicional</label>

          <textarea
            id="detalleProducto"
            value={formulario.detalle}
            onChange={(evento) =>
              actualizarCampo("detalle", limpiarTexto(evento.target.value))
            }
            maxLength={1000}
            placeholder="Características, recomendaciones de uso o información técnica adicional."
            disabled={guardando}
          />

          <small>Campo opcional. Máximo 1.000 caracteres.</small>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="precioNormal">Precio normal</label>

          <input
            id="precioNormal"
            type="number"
            min="1"
            step="1"
            value={formulario.precioNormal}
            onChange={(evento) =>
              actualizarCampo("precioNormal", evento.target.value)
            }
            placeholder="29990"
            disabled={guardando}
          />
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="precioOferta">Precio de oferta</label>

          <input
            id="precioOferta"
            type="number"
            min="1"
            step="1"
            value={formulario.precioOferta}
            onChange={(evento) =>
              actualizarCampo("precioOferta", evento.target.value)
            }
            placeholder="Opcional"
            disabled={guardando}
          />

          <small>Debe ser menor que el precio normal.</small>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="stockProducto">Stock inicial</label>

          <input
            id="stockProducto"
            type="number"
            min="0"
            step="1"
            value={formulario.stock}
            onChange={(evento) => actualizarCampo("stock", evento.target.value)}
            disabled={guardando}
          />
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="familiaProducto">Familia</label>

          <select
            id="familiaProducto"
            value={formulario.familiaId}
            onChange={cambiarFamilia}
            disabled={guardando}
          >
            <option value="">Selecciona una familia</option>

            {familias.map((familia) => (
              <option key={familia.id_familia} value={familia.id_familia}>
                {familia.nom_familia}
              </option>
            ))}
          </select>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="subcategoriaProducto">Subcategoría</label>

          <select
            id="subcategoriaProducto"
            value={formulario.subcategoriaId}
            onChange={(evento) =>
              actualizarCampo("subcategoriaId", evento.target.value)
            }
            disabled={guardando || !formulario.familiaId}
          >
            <option value="">Selecciona una subcategoría</option>

            {subcategoriasFiltradas.map((subcategoria) => (
              <option
                key={subcategoria.id_subcategoria}
                value={subcategoria.id_subcategoria}
              >
                {subcategoria.nom_subcategoria}
              </option>
            ))}
          </select>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="marcaProducto">Marca</label>

          <select
            id="marcaProducto"
            value={formulario.marcaId}
            onChange={(evento) =>
              actualizarCampo("marcaId", evento.target.value)
            }
            disabled={guardando}
          >
            <option value="">Sin marca</option>

            {marcas.map((marca) => (
              <option key={marca.id_marca} value={marca.id_marca}>
                {marca.nom_marca}
              </option>
            ))}
          </select>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="unidadProducto">Unidad de medida</label>

          <select
            id="unidadProducto"
            value={formulario.unidadId}
            onChange={(evento) =>
              actualizarCampo("unidadId", evento.target.value)
            }
            disabled={guardando}
          >
            <option value="">Selecciona una unidad</option>

            {unidades.map((unidad) => (
              <option key={unidad.id_und_medida} value={unidad.id_und_medida}>
                {unidad.nom_und_medida}
              </option>
            ))}
          </select>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="colorProducto">Color</label>

          <input
            id="colorProducto"
            type="text"
            value={formulario.color}
            onChange={(evento) =>
              actualizarCampo("color", limpiarTexto(evento.target.value))
            }
            maxLength={50}
            placeholder="Ej: Transparente"
            disabled={guardando}
          />

          <small>Campo opcional.</small>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="pesoProducto">Peso o contenido</label>

          <input
            id="pesoProducto"
            type="number"
            min="0.01"
            step="0.01"
            value={formulario.peso}
            onChange={(evento) => actualizarCampo("peso", evento.target.value)}
            placeholder="Ej: 2"
            disabled={guardando}
          />

          <small>La unidad se define en el selector correspondiente.</small>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="imagenProducto">Imagen del producto</label>

          <input
            id="imagenProducto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={seleccionarImagen}
            disabled={guardando}
          />

          <small>JPG, PNG o WEBP. Máximo 10 MB.</small>
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="documentoProducto">Documentos técnicos</label>

          <input
            id="documentoProducto"
            type="file"
            accept="application/pdf"
            multiple
            onChange={seleccionarDocumentos}
            disabled={guardando}
          />

          <small>
            Puedes seleccionar uno o más PDF. Máximo 20 MB por documento.
          </small>
        </div>
      </div>

      <div className="producto-bodega-form__resources">
        <div className="producto-bodega-form__preview">
          <span>Vista previa</span>

          {vistaPreviaImagen ? (
            <img src={vistaPreviaImagen} alt="Vista previa del producto" />
          ) : (
            <div className="producto-bodega-form__placeholder">Sin imagen</div>
          )}
        </div>

        <div className="producto-bodega-form__document">
          <span>Documentos asociados</span>

          {documentosPdf.length > 0 ? (
            <>
              <p>Nuevos documentos seleccionados:</p>

              <ul className="producto-bodega-form__document-list">
                {documentosPdf.map((archivo) => (
                  <li
                    key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                  >
                    {archivo.name}
                  </li>
                ))}
              </ul>

              {documentosActuales.length > 0 && (
                <>
                  <p>Documentos actuales:</p>

                  <ul className="producto-bodega-form__document-list">
                    {documentosActuales.map((documento) => (
                      <li key={documento.id_documento}>
                        {documento.nombre_documento || "Documento PDF"}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : documentosActuales.length > 0 ? (
            <ul className="producto-bodega-form__document-list">
              {documentosActuales.map((documento) => (
                <li key={documento.id_documento}>
                  {documento.nombre_documento || "Documento PDF"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Sin documentos técnicos.</p>
          )}
        </div>
      </div>

      <div className="producto-bodega-form__actions">
        <button
          type="submit"
          className="producto-bodega-form__save"
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : editando
              ? "Actualizar producto"
              : "Crear producto"}
        </button>

        <button
          type="button"
          className="producto-bodega-form__cancel"
          onClick={onCancelar}
          disabled={guardando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default ProductoFormBodeguero;
