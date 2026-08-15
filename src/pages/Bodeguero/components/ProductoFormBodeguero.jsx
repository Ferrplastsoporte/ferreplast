import { useEffect, useMemo, useRef, useState } from "react";
import "../css/Productos-bodeguero.css";

const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;
const TAMANO_MAXIMO_PDF = 20 * 1024 * 1024;

const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const TIPOS_DOCUMENTO = [
  {
    value: "ficha_tecnica",
    label: "Ficha técnica",
  },
  {
    value: "hoja_seguridad",
    label: "Hoja de seguridad",
  },
  {
    value: "certificado",
    label: "Certificado",
  },
  {
    value: "manual",
    label: "Manual",
  },
  {
    value: "otro",
    label: "Otro",
  },
];

const ESTADO_INICIAL = {
  nombre: "",
  descripcion: "",
  detalle: "",
  precioNormal: "",
  precioOferta: "",
  stock: "1",
  familiaId: "",
  subcategoriaId: "",
  marcaId: "",
  unidadId: "",
  color: "",
  peso: "1",
};

function limpiarTexto(valor = "") {
  return String(valor)
    .replace(/[<>[\]{}]/g, "")
    .replace(/\s{2,}/g, " ");
}

function limpiarEnteroPositivo(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function obtenerNombreTipoDocumento(tipo = "") {
  return (
    TIPOS_DOCUMENTO.find((opcion) => opcion.value === tipo)?.label || "Otro"
  );
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
  esEdicion = false,
}) {
  const inputDocumentosRef = useRef(null);

  const [formulario, setFormulario] = useState(ESTADO_INICIAL);

  const [imagen, setImagen] = useState(null);

  /*
   * Estructura:
   * {
   *   idTemporal,
   *   archivo,
   *   tipoDocumento
   * }
   */
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

    const precioNormal =
      productoInicial.precio_prod !== null &&
      productoInicial.precio_prod !== undefined
        ? String(productoInicial.precio_prod)
        : "";

    setFormulario({
      nombre: productoInicial.nom_prod ?? "",

      descripcion: productoInicial.desc_prod ?? "",

      detalle: productoInicial.detalle_prod ?? "",

      precioNormal,

      precioOferta:
        productoInicial.precio_act !== null &&
        productoInicial.precio_act !== undefined
          ? String(productoInicial.precio_act)
          : precioNormal,

      stock:
        productoInicial.stock_prod !== null &&
        productoInicial.stock_prod !== undefined
          ? String(productoInicial.stock_prod)
          : "1",

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
          : "1",
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

  function actualizarEntero(campo, valor) {
    actualizarCampo(campo, limpiarEnteroPositivo(valor));
  }

  function normalizarEnteroMinimoUno(campo) {
    setFormulario((estadoAnterior) => {
      const valorActual = Number(estadoAnterior[campo]);

      return {
        ...estadoAnterior,
        [campo]:
          Number.isInteger(valorActual) && valorActual >= 1
            ? String(valorActual)
            : "1",
      };
    });
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

  function crearIdTemporal(archivo) {
    return [
      archivo.name,
      archivo.size,
      archivo.lastModified,
      Date.now(),
      Math.random(),
    ].join("-");
  }

  function seleccionarDocumentos(evento) {
    const archivos = Array.from(evento.target.files ?? []);

    setMensajeError("");

    if (archivos.length === 0) {
      return;
    }

    const archivoInvalido = archivos.find(
      (archivo) => archivo.type !== "application/pdf",
    );

    if (archivoInvalido) {
      evento.target.value = "";

      setMensajeError(
        `El archivo "${archivoInvalido.name}" no está en formato PDF.`,
      );

      return;
    }

    const archivoDemasiadoGrande = archivos.find(
      (archivo) => archivo.size > TAMANO_MAXIMO_PDF,
    );

    if (archivoDemasiadoGrande) {
      evento.target.value = "";

      setMensajeError(
        `El documento "${archivoDemasiadoGrande.name}" supera los 20 MB.`,
      );

      return;
    }

    const documentoRepetido = archivos.find((archivo) =>
      documentosPdf.some(
        (documento) =>
          documento.archivo.name === archivo.name &&
          documento.archivo.size === archivo.size,
      ),
    );

    if (documentoRepetido) {
      evento.target.value = "";

      setMensajeError(
        `El documento "${documentoRepetido.name}" ya fue seleccionado.`,
      );

      return;
    }

    const nuevosDocumentos = archivos.map((archivo) => ({
      idTemporal: crearIdTemporal(archivo),

      archivo,

      tipoDocumento: "",
    }));

    setDocumentosPdf((documentosAnteriores) => [
      ...documentosAnteriores,
      ...nuevosDocumentos,
    ]);

    evento.target.value = "";
  }

  function cambiarTipoDocumento(idTemporal, tipoDocumento) {
    setDocumentosPdf((documentosAnteriores) =>
      documentosAnteriores.map((documento) =>
        documento.idTemporal === idTemporal
          ? {
              ...documento,
              tipoDocumento,
            }
          : documento,
      ),
    );
  }

  function quitarDocumento(idTemporal) {
    setDocumentosPdf((documentosAnteriores) =>
      documentosAnteriores.filter(
        (documento) => documento.idTemporal !== idTemporal,
      ),
    );
  }

  function validarFormulario() {
    const nombre = formulario.nombre.trim();

    const descripcion = formulario.descripcion.trim();

    const detalle = formulario.detalle.trim();

    const precioNormal = Number(formulario.precioNormal);

    const precioOferta =
      formulario.precioOferta === ""
        ? precioNormal
        : Number(formulario.precioOferta);

    const stock = Number(formulario.stock);

    const peso = Number(formulario.peso);

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

    if (!Number.isInteger(precioNormal) || precioNormal < 1) {
      return "El precio normal debe ser un número entero desde 1 en adelante.";
    }

    if (!Number.isInteger(precioOferta) || precioOferta < 1) {
      return "El precio vigente debe ser un número entero desde 1 en adelante.";
    }

    if (precioOferta > precioNormal) {
      return "El precio de oferta no puede ser mayor que el precio normal.";
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

    if (!Number.isInteger(stock) || stock < 1) {
      return "El stock debe ser un número entero desde 1 en adelante.";
    }

    if (!Number.isInteger(peso) || peso < 1) {
      return "El peso o contenido debe ser un número entero desde 1 en adelante.";
    }

    const documentoSinTipo = documentosPdf.find(
      (documento) => !documento.tipoDocumento,
    );

    if (documentoSinTipo) {
      return `Debes seleccionar el tipo del documento "${documentoSinTipo.archivo.name}".`;
    }

    return null;
  }

  function construirDatosProducto() {
    const precioNormal = Number(formulario.precioNormal);

    return {
      nom_prod: formulario.nombre.trim(),

      desc_prod: formulario.descripcion.trim(),

      detalle_prod: formulario.detalle.trim() || null,

      precio_prod: precioNormal,

      /*
       * Si queda vacío, se almacena el
       * mismo precio normal.
       */
      precio_act:
        formulario.precioOferta === ""
          ? precioNormal
          : Number(formulario.precioOferta),

      stock_prod: Number(formulario.stock),

      id_subcategoria: Number(formulario.subcategoriaId),

      id_und_medida: Number(formulario.unidadId),

      id_marca: formulario.marcaId ? Number(formulario.marcaId) : null,

      color_prod: formulario.color.trim() || null,

      peso_prod: Number(formulario.peso),

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
            type="text"
            inputMode="numeric"
            value={formulario.precioNormal}
            onChange={(evento) =>
              actualizarEntero("precioNormal", evento.target.value)
            }
            placeholder="29990"
            disabled={guardando}
          />
        </div>

        <div className="producto-bodega-form__field">
          <label htmlFor="precioOferta">Precio vigente u oferta</label>

          <input
            id="precioOferta"
            type="text"
            inputMode="numeric"
            value={formulario.precioOferta}
            onChange={(evento) =>
              actualizarEntero("precioOferta", evento.target.value)
            }
            placeholder="Vacío = precio normal"
            disabled={guardando}
          />

          <small>Puede ser igual o menor que el precio normal.</small>
        </div>

        {!esEdicion && (
  <div className="producto-bodega-form__field">
    <label htmlFor="stockProducto">Stock inicial</label>
    <input
      id="stockProducto"
      type="text"
      inputMode="numeric"
      value={formulario.stock}
      onChange={(evento) =>
        actualizarEntero("stock", evento.target.value)
      }
      onBlur={() => normalizarEnteroMinimoUno("stock")}
      disabled={guardando}
    />
    <small>Solo números enteros desde 1.</small>
  </div>
)}

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
            type="text"
            inputMode="numeric"
            value={formulario.peso}
            onChange={(evento) => actualizarEntero("peso", evento.target.value)}
            onBlur={() => normalizarEnteroMinimoUno("peso")}
            placeholder="Ej: 2"
            disabled={guardando}
          />

          <small>Solo números enteros desde 1.</small>
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
            ref={inputDocumentosRef}
            id="documentoProducto"
            type="file"
            accept="application/pdf"
            multiple
            onChange={seleccionarDocumentos}
            disabled={guardando}
          />

          <small>Puedes agregar varios PDF. Máximo 20 MB por archivo.</small>
        </div>
      </div>

      {documentosPdf.length > 0 && (
        <section className="producto-bodega-form__new-documents">
          <h3>Nuevos documentos seleccionados</h3>

          <div className="producto-bodega-form__document-selection">
            {documentosPdf.map((documento) => (
              <div
                className="producto-bodega-form__document-row"
                key={documento.idTemporal}
              >
                <div className="producto-bodega-form__document-name">
                  <strong>{documento.archivo.name}</strong>

                  <span>
                    {(documento.archivo.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <select
                  value={documento.tipoDocumento}
                  onChange={(evento) =>
                    cambiarTipoDocumento(
                      documento.idTemporal,
                      evento.target.value,
                    )
                  }
                  disabled={guardando}
                  aria-label={`Tipo del documento ${documento.archivo.name}`}
                >
                  <option value="">Selecciona el tipo</option>

                  {TIPOS_DOCUMENTO.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="producto-bodega-form__remove-document"
                  onClick={() => quitarDocumento(documento.idTemporal)}
                  disabled={guardando}
                  aria-label={`Quitar ${documento.archivo.name}`}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

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

          {documentosActuales.length > 0 ? (
            <ul className="producto-bodega-form__document-list">
              {documentosActuales.map((documento) => (
                <li key={documento.id_documento}>
                  <strong>
                    {documento.nombre_documento || "Documento PDF"}
                  </strong>

                  <span>
                    {obtenerNombreTipoDocumento(documento.tipo_documento)}
                  </span>
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
