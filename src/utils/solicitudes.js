export const NOMBRES_CAMPOS = {
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

export const NOMBRES_ACCIONES = {
  actualizacion: "Producto actualizado",
  ajuste_stock: "Stock actualizado",
  enviado_revision: "Enviado a revisión",
  producto_aprobado: "Producto aprobado",
  producto_no_disponible: "Marcado como no disponible",
  cambio_estado: "Estado modificado",
};

export function formatearFecha(fecha) {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(fecha));
}

export function obtenerDetalleCambios(campos = {}) {
  if (!campos || typeof campos !== "object" || Array.isArray(campos)) {
    return [];
  }

  return Object.entries(campos).map(([campo, cambio]) => ({
    campo: NOMBRES_CAMPOS[campo] || campo,
    anterior:
      cambio?.anterior === null ||
      cambio?.anterior === undefined ||
      cambio?.anterior === ""
        ? "Sin valor"
        : String(cambio.anterior),

    nuevo:
      cambio?.nuevo === null ||
      cambio?.nuevo === undefined ||
      cambio?.nuevo === ""
        ? "Sin valor"
        : String(cambio.nuevo),
  }));
}