import { supabase } from "../lib/supabase";

export async function obtenerTiposDespachoActivos() {
  const { data, error } = await supabase
    .from("tipo_despacho")
    .select(
      `
      id_tipo_despacho,
      nom_tipo_despacho,
      costo,
      est_tipo,
      requiere_coordinacion
      `,
    )
    .eq("est_tipo", true)
    .order("id_tipo_despacho", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}
