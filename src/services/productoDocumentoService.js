import { supabase } from "../lib/supabase";

import {
  subirDocumentoProducto,
  eliminarDocumentoProducto,
} from "./productoStorageService";

const BUCKET_DOCUMENTOS = "producto-documentos";

export async function obtenerProductosConDocumentos() {
  const { data, error } = await supabase
    .from("producto")
    .select(
      `
      id_prod,
      nom_prod,
      producto_documento (
        id_documento,
        est_documento
      )
    `,
    )
    .order("nom_prod", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function obtenerDocumentosProducto(idProd) {
  if (!idProd || idProd <= 0) {
    throw new Error("El producto indicado no es válido.");
  }

  const { data, error } = await supabase
    .from("producto_documento")
    .select(
      `
      id_documento,
      id_prod,
      nombre_documento,
      tipo_documento,
      archivo_path,
      est_documento,
      created_at,
      ultima_act_doc
    `,
    )
    .eq("id_prod", idProd)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function habilitarDocumento(idDocumento) {
  if (!idDocumento || idDocumento <= 0) {
    throw new Error("El documento indicado no es válido.");
  }

  const { data, error } = await supabase
    .from("producto_documento")
    .update({
      est_documento: true,
    })
    .eq("id_documento", idDocumento)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deshabilitarDocumento(idDocumento) {
  if (!idDocumento || idDocumento <= 0) {
    throw new Error("El documento indicado no es válido.");
  }

  const { error } = await supabase.rpc("desactivar_documento_producto", {
    p_id_documento: idDocumento,
  });

  if (error) {
    throw error;
  }

  return true;
}

export async function obtenerUrlDocumento(archivoPath) {
  if (!archivoPath) {
    throw new Error("El documento no posee una ruta válida.");
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .createSignedUrl(archivoPath, 60 * 5);

  if (error) {
    throw error;
  }

  if (!data?.signedUrl) {
    throw new Error("No fue posible generar la URL del documento.");
  }

  return data.signedUrl;
}

export async function agregarDocumentoProducto({
  idProd,
  archivo,
  tipoDocumento,
}) {
  if (!idProd || idProd <= 0) {
    throw new Error("El producto indicado no es válido.");
  }

  if (!archivo) {
    throw new Error("Debes seleccionar un archivo.");
  }

  if (!tipoDocumento?.trim()) {
    throw new Error("Debes seleccionar el tipo de documento.");
  }

  const esPdf =
    archivo.type === "application/pdf" ||
    archivo.name?.toLowerCase().endsWith(".pdf");

  if (!esPdf) {
    throw new Error("Solo se permiten archivos PDF.");
  }

  const archivoPath = await subirDocumentoProducto(idProd, archivo);

  const { data, error: insertError } = await supabase
    .from("producto_documento")
    .insert({
      id_prod: idProd,
      nombre_documento: archivo.name,
      tipo_documento: tipoDocumento,
      archivo_path: archivoPath,
      est_documento: true,
    })
    .select()
    .single();

  if (insertError) {
    try {
      await eliminarDocumentoProducto(archivoPath);
    } catch (cleanupError) {
      console.error(
        "No fue posible eliminar el archivo huérfano:",
        cleanupError,
      );
    }

    throw insertError;
  }

  return data;
}
