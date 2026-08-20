import { supabase } from "../lib/supabase";

const BUCKET_IMAGENES = "imagenes_productos";
const BUCKET_DOCUMENTOS = "producto-documentos";

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

/* =======================================================
   IMÁGENES
======================================================= */

export function obtenerUrlImagenProducto(rutaImagen, version = null) {
  if (!rutaImagen) return "";

  const separador = rutaImagen.includes("?") ? "&" : "?";

  if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
    return version ? `${rutaImagen}${separador}v=${version}` : rutaImagen;
  }

  const { data } = supabase.storage
    .from(BUCKET_IMAGENES)
    .getPublicUrl(rutaImagen);

  if (!data?.publicUrl) return "";

  return version ? `${data.publicUrl}?v=${version}` : data.publicUrl;
}

export async function eliminarImagenProducto(rutaImagen) {
  if (!rutaImagen) return;

  if (rutaImagen.startsWith("http://") || rutaImagen.startsWith("https://")) {
    return;
  }

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .remove([rutaImagen]);

  if (error) {
    console.warn("No fue posible eliminar la imagen anterior:", error);
  }
}

export async function subirImagenProducto(idProducto, archivo) {
  if (!archivo) {
    throw new Error("No se seleccionó una imagen válida.");
  }

  const extension = obtenerExtensionImagen(archivo);
  const rutaNueva = `producto/${idProducto}/imagen.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(rutaNueva, archivo, {
      upsert: true,
      cacheControl: "0",
      contentType: archivo.type,
    });

  if (error) throw error;

  return rutaNueva;
}

/* =======================================================
   DOCUMENTOS PDF
======================================================= */

export async function subirDocumentoProducto(idProducto, archivo) {
  if (!archivo) {
    throw new Error("No se seleccionó un documento válido.");
  }

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

export async function eliminarDocumentoProducto(rutaDocumento) {
  if (!rutaDocumento) return;

  const { error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .remove([rutaDocumento]);

  if (error) {
    console.warn("No fue posible eliminar el documento:", error);
  }
}
