export const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;
export const TAMANO_MAXIMO_PDF = 20 * 1024 * 1024;

export const TIPOS_IMAGEN_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const TIPOS_DOCUMENTO = [
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

export const ESTADO_INICIAL_PRODUCTO = {
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

export function limpiarTextoProducto(valor = "") {
  return String(valor)
    .replace(/[<>[\]{}]/g, "")
    .replace(/\s{2,}/g, " ");
}

export function limpiarEnteroProducto(valor = "") {
  return String(valor).replace(/\D/g, "");
}

export function obtenerNombreTipoDocumento(tipo = "") {
  return (
    TIPOS_DOCUMENTO.find((opcion) => opcion.value === tipo)?.label || "Otro"
  );
}

export function crearIdTemporalDocumento(archivo) {
  return [
    archivo.name,
    archivo.size,
    archivo.lastModified,
    Date.now(),
    Math.random(),
  ].join("-");
}

export function validarImagenProducto(archivo) {
  if (!archivo) {
    return {
      valido: true,
      error: "",
    };
  }

  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
    return {
      valido: false,
      error: "La imagen debe estar en formato JPG, PNG o WEBP.",
    };
  }

  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return {
      valido: false,
      error: "La imagen no puede superar los 10 MB.",
    };
  }

  return {
    valido: true,
    error: "",
  };
}

export function validarDocumentosProducto(
  archivos = [],
  documentosSeleccionados = [],
) {
  if (!Array.isArray(archivos)) {
    return {
      valido: false,
      error: "La selección de documentos no es válida.",
    };
  }

  const archivoInvalido = archivos.find(
    (archivo) => archivo.type !== "application/pdf",
  );

  if (archivoInvalido) {
    return {
      valido: false,
      error: `El archivo "${archivoInvalido.name}" no está en formato PDF.`,
    };
  }

  const archivoDemasiadoGrande = archivos.find(
    (archivo) => archivo.size > TAMANO_MAXIMO_PDF,
  );

  if (archivoDemasiadoGrande) {
    return {
      valido: false,
      error: `El documento "${archivoDemasiadoGrande.name}" supera los 20 MB.`,
    };
  }

  const documentoRepetido = archivos.find((archivo) =>
    documentosSeleccionados.some(
      (documento) =>
        documento.archivo.name === archivo.name &&
        documento.archivo.size === archivo.size,
    ),
  );

  if (documentoRepetido) {
    return {
      valido: false,
      error: `El documento "${documentoRepetido.name}" ya fue seleccionado.`,
    };
  }

  return {
    valido: true,
    error: "",
  };
}

export function validarFormularioProducto({
  formulario,
  subcategoriasFiltradas = [],
  documentosPdf = [],
  esEdicion = false,
}) {
  const nombre = formulario.nombre.trim();
  const descripcion = formulario.descripcion.trim();
  const detalle = formulario.detalle.trim();

  const precioNormal = Number(formulario.precioNormal);

  const precioOferta =
    formulario.precioOferta === ""
      ? precioNormal
      : Number(formulario.precioOferta);

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

  /*
   * Stock solo se valida durante la creación.
   * La edición utiliza ajustar_stock_producto().
   */
  if (!esEdicion) {
    const stock = Number(formulario.stock);

    if (!Number.isInteger(stock) || stock < 1) {
      return "El stock debe ser un número entero desde 1 en adelante.";
    }
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

export function construirDatosProducto(
  formulario,
  { imagen = null, documentosPdf = [], esEdicion = false } = {},
) {
  const precioNormal = Number(formulario.precioNormal);

  const datos = {
    nom_prod: formulario.nombre.trim(),

    desc_prod: formulario.descripcion.trim(),

    detalle_prod: formulario.detalle.trim() || null,

    precio_prod: precioNormal,

    precio_act:
      formulario.precioOferta === ""
        ? precioNormal
        : Number(formulario.precioOferta),

    id_subcategoria: Number(formulario.subcategoriaId),

    id_und_medida: Number(formulario.unidadId),

    id_marca: formulario.marcaId ? Number(formulario.marcaId) : null,

    color_prod: formulario.color.trim() || null,

    peso_prod: Number(formulario.peso),

    imagen,

    documentosPdf,
  };

  /*
   * Solo enviamos stock al crear.
   */
  if (!esEdicion) {
    datos.stock_prod = Number(formulario.stock);
  }

  return datos;
}
