import { supabase } from "../lib/supabase";
import { obtenerExtensionLogoMarca, validarLogoMarca } from "../utils/catalogo/marcas";

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
  if (/^https?:\/\//i.test(rutaLogo)) return;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .remove([rutaLogo]);

  if (error) {
    console.warn("No fue posible eliminar el logo anterior:", error);
  }
}

export async function subirLogoMarca(idMarca, archivo) {
  if (!archivo) {
    throw new Error("No se seleccionó un logo.");
  }

  const validacion = validarLogoMarca(archivo);
  if (!validacion.valido) throw new Error(validacion.error);

  const extension = obtenerExtensionLogoMarca(archivo);
  const identificador = crypto.randomUUID();
  // Una marca nueva aún no tiene ID. Su carpeta puede identificarse con UUID.
  const rutaNueva = `marca/${idMarca ?? identificador}/logo_${identificador}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES)
    .upload(rutaNueva, archivo, {
      cacheControl: "0",
      upsert: false,
      contentType: archivo.type,
    });

  if (error) {
    throw error;
  }

  return rutaNueva;
}

export async function guardarMarcaConLogo({
  nombre,
  destacar,
  marcaActual = null,
  archivoLogo = null,
}) {
  // Revisa el estado vigente antes de subir archivos de un formulario antiguo.
  // La RPC vuelve a comprobarlo bajo bloqueo de fila.
  if (marcaActual) {
    const { data, error } = await supabase
      .from("marca_producto")
      .select("id_estado_marca")
      .eq("id_marca", marcaActual.id_marca)
      .single();

    if (error) throw error;
    if (Number(data.id_estado_marca) === 1) {
      throw Object.assign(
        new Error("Esta marca está pendiente de revisión. Podrás editarla cuando el administrador resuelva la solicitud."),
        { code: "55000" },
      );
    }
  }

  let rutaNueva = null;
  let guardada = false;

  try {
    if (archivoLogo) {
      rutaNueva = await subirLogoMarca(marcaActual?.id_marca, archivoLogo);
    }

    const { data, error } = await supabase.rpc("guardar_marca", {
      p_nombre: nombre,
      p_destacar: destacar,
      p_id_marca: marcaActual?.id_marca ?? null,
      p_logo_url: rutaNueva,
    });

    if (error) throw error;
    guardada = true;

    // Conserva el logo anterior hasta que la base confirme el reemplazo.
    if (rutaNueva && marcaActual?.logo_url) {
      try {
        await eliminarLogoMarca(marcaActual.logo_url);
      } catch (errorLimpieza) {
        console.warn("No fue posible eliminar el logo anterior:", errorLimpieza);
      }
    }

    return data;
  } catch (error) {
    if (rutaNueva && !guardada) {
      try {
        await eliminarLogoMarca(rutaNueva);
      } catch (errorLimpieza) {
        console.warn("No fue posible retirar el logo no guardado:", errorLimpieza);
      }
    }
    throw error;
  }
}
