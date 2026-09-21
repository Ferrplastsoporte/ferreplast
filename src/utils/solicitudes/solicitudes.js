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

  // Peligrosidad
  peligrosidad: "Peligrosidad",
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

  return Object.entries(campos).flatMap(([campo, cambio]) => {
    if (campo === "peligrosidad") {
      const agregadas = Array.isArray(cambio?.agregadas)
        ? cambio.agregadas
        : [];

      const eliminadas = Array.isArray(cambio?.eliminadas)
        ? cambio.eliminadas
        : [];

      const detalles = [];

      if (agregadas.length > 0) {
        detalles.push({
          campo: "Peligrosidad agregada",
          anterior: "Ninguna",
          nuevo: agregadas.join(", "),
        });
      }

      if (eliminadas.length > 0) {
        detalles.push({
          campo: "Peligrosidad eliminada",
          anterior: eliminadas.join(", "),
          nuevo: "Ninguna",
        });
      }

      return detalles;
    }

    return [
      {
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
      },
    ];
  });
}
