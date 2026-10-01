import { supabase } from "../lib/supabase";

/**
 * Obtiene todos los métodos de pago.
 */
export async function obtenerMetodosPago() {
  const { data, error } = await supabase
    .from("metodo_pago")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Obtiene solamente los métodos de pago activos.
 */
export async function obtenerMetodosPagoActivos() {
  const { data, error } = await supabase
    .from("metodo_pago")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Actualiza el estado de un método de pago.
 */
export async function actualizarEstadoMetodoPago(
  idMetodoPago,
  activo
) {
  const { data, error } = await supabase
    .from("metodo_pago")
    .update({
      activo: activo,
    })
    .eq("id_metodo_pago", idMetodoPago)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}