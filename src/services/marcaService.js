import { supabase } from "../lib/supabase";
import { obtenerExtensionLogoMarca } from "../utils/marcas";

const BUCKET_IMAGENES = "imagenes_productos";

export function obtenerUrlLogoMarca(rutaLogo, version = null) {
  if (!rutaLogo) return "";

  const separador = rutaLogo.includes("?") ? "&" : "?";

  if (rutaLogo.startsWith("http://") || rutaLogo.startsWith("https://")) {
    return version ? `${rutaLogo}${separador}v=${version}` : rutaLogo;
  }

  const { data } = supabase.storage
    .from(BUCKET_IMAGENES)
    .getPublicUrl(rutaLogo);

  if (!data?.publicUrl) return "";

  return version ? `${data.publicUrl}?v=${version}` : data.publicUrl;
}

/*
 * Elimina un archivo específico del bucket.
 *
 * Si falla no lanza excepción porque un logo
 * anterior inexistente no debería impedir
 * subir el nuevo.
 */
export async function eliminarLogoMarca(rutaLogo) {
  if (!rutaLogo) return;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .remove([rutaLogo]);

  if (error) {
    console.warn("No fue posible eliminar el logo anterior:", error);
  }
}

export async function subirLogoMarca(idMarca, archivo, rutaAnterior = null) {
  if (!archivo) {
    throw new Error("No se seleccionó un logo.");
  }

  const extension = obtenerExtensionLogoMarca(archivo);
  const rutaNueva = `marca/${idMarca}/logo.${extension}`;

  if (rutaAnterior && rutaAnterior !== rutaNueva) {
    await eliminarLogoMarca(rutaAnterior);
  }

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(rutaNueva, archivo, {
      cacheControl: "0",
      upsert: true,
      contentType: archivo.type,
    });

  if (error) {
    throw error;
  }

  return rutaNueva;
}
