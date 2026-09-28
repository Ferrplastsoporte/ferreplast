import { supabase } from "../lib/supabase";

const BUCKET_PLANTILLAS = "plantillas-cotizacion";

const RECURSOS_PLANTILLA = {
  logo: {
    nombreArchivo: "logo",
    columna: "logo_storage_path",
  },
  firmaElaborador: {
    nombreArchivo: "firma-elaborador",
    columna: "firma_elaborador_storage_path",
  },
  firmaAutorizador: {
    nombreArchivo: "firma-autorizador",
    columna: "firma_autorizador_storage_path",
  },
};

async function ejecutarRpc(nombre, parametros) {
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) throw error;
  return data;
}

export async function cargarConfiguracionCotizacionAdmin() {
  const [resultadoGeneral, resultadoPlantilla] = await Promise.all([
    ejecutarRpc("obtener_configuracion_cotizacion_admin"),
    ejecutarRpc("obtener_plantilla_cotizacion_admin"),
  ]);

  return {
    configuracion: resultadoGeneral?.[0] ?? null,
    plantilla: resultadoPlantilla?.[0] ?? null,
  };
}

export async function actualizarConfiguracionCotizacionAdmin(
  diasValidez,
  tasaIva,
) {
  const resultado = await ejecutarRpc("actualizar_configuracion_cotizacion", {
    p_dias_validez: diasValidez,
    p_tasa_iva: tasaIva,
  });

  return resultado?.[0] ?? null;
}

export function actualizarPlantillaCotizacionAdmin(datosPlantilla) {
  return ejecutarRpc("actualizar_plantilla_cotizacion_admin", {
    p_datos: datosPlantilla,
  });
}

export async function obtenerUrlRecursoPlantilla(ruta) {
  if (!ruta) return "";

  const { data, error } = await supabase.storage
    .from(BUCKET_PLANTILLAS)
    .createSignedUrl(ruta, 3600);

  if (error) throw error;
  return data?.signedUrl ?? "";
}

async function registrarRutaRecurso(columna, ruta) {
  const resultado = await ejecutarRpc(
    "actualizar_recursos_plantilla_cotizacion_admin",
    {
      p_recursos: { [columna]: ruta },
    },
  );

  return resultado?.[0] ?? null;
}

export async function subirRecursoPlantilla(
  idPlantilla,
  tipoRecurso,
  archivo,
) {
  const recurso = RECURSOS_PLANTILLA[tipoRecurso];
  if (!recurso || !idPlantilla) {
    throw new Error("El recurso de la plantilla no es válido.");
  }

  const ruta = `plantillas/${idPlantilla}/${recurso.nombreArchivo}`;
  const { error } = await supabase.storage
    .from(BUCKET_PLANTILLAS)
    .upload(ruta, archivo, {
      cacheControl: "3600",
      contentType: archivo.type,
      upsert: true,
    });

  if (error) throw error;

  try {
    await registrarRutaRecurso(recurso.columna, ruta);
    return {
      ruta,
      url: await obtenerUrlRecursoPlantilla(ruta),
    };
  } catch (errorRegistro) {
    await supabase.storage.from(BUCKET_PLANTILLAS).remove([ruta]);
    throw errorRegistro;
  }
}

export async function eliminarRecursoPlantilla(tipoRecurso, rutaActual) {
  const recurso = RECURSOS_PLANTILLA[tipoRecurso];
  if (!recurso) {
    throw new Error("El recurso de la plantilla no es válido.");
  }

  await registrarRutaRecurso(recurso.columna, null);

  if (rutaActual) {
    const { error } = await supabase.storage
      .from(BUCKET_PLANTILLAS)
      .remove([rutaActual]);
    if (error) {
      console.error("No fue posible limpiar el archivo anterior:", error);
    }
  }
}
