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
  producto_creado: "Producto creado",
  producto_modificado: "Producto modificado",
  actualizacion: "Producto actualizado",
  ajuste_stock: "Ajuste de stock solicitado",
  movimiento_stock: "Movimiento de stock",
  enviado_revision: "Enviado a revisión",
  producto_aprobado: "Producto aprobado",
  producto_rechazado: "Producto rechazado",
  producto_reactivado: "Producto reactivado",
  reactivacion_solicitada: "Reactivación solicitada",
  producto_no_disponible: "Marcado como no disponible",
  cambio_estado: "Estado modificado",
};

export function obtenerDatosSolicitud(cambio) {
  const datos = cambio?.campos_modificados?._solicitud;
  return datos && typeof datos === "object" && !Array.isArray(datos)
    ? datos
    : null;
}

export function esSolicitudPendiente(cambio) {
  return cambio?.revisado === false &&
    obtenerDatosSolicitud(cambio)?.estado === "pendiente";
}

export function esSolicitudStock(cambio) {
  return obtenerDatosSolicitud(cambio)?.tipo === "stock";
}

export function obtenerEstadoSolicitud(cambio) {
  return {
    pendiente: "Pendiente",
    aprobada: "Aprobado",
    rechazada: "Rechazado",
  }[obtenerDatosSolicitud(cambio)?.estado] ?? null;
}

export function formatearFecha(fecha) {
  if (!fecha) return "";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(new Date(fecha));
}

function formatearValorCambio(campo, valor, nombresReferencias) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin valor";
  }

  if (["precio_prod", "precio_act"].includes(campo) && Number.isFinite(Number(valor))) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency", currency: "CLP", maximumFractionDigits: 0,
    }).format(Number(valor));
  }

  return nombresReferencias?.[campo]?.[String(valor)] ?? String(valor);
}

export function obtenerDetalleCambios(campos = {}, nombresReferencias = {}) {
  if (!campos || typeof campos !== "object" || Array.isArray(campos)) {
    return [];
  }

  return Object.entries(campos).flatMap(([campo, cambio]) => {
    // Metadatos del proceso, no campos comparables del producto.
    if (campo.startsWith("_")) return [];
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

    if (!cambio || typeof cambio !== "object" ||
      !("anterior" in cambio) || !("nuevo" in cambio)) return [];

    return [
      {
        campo: NOMBRES_CAMPOS[campo] || campo,

        anterior: formatearValorCambio(
          campo,
          cambio?.anterior,
          nombresReferencias,
        ),

        nuevo: formatearValorCambio(
          campo,
          cambio?.nuevo,
          nombresReferencias,
        ),
      },
    ];
  });
}
