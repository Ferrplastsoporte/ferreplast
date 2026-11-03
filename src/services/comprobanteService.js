import { supabase } from "../lib/supabase";

export async function solicitarComprobante(idPedido) {
  const { data, error } = await supabase.functions.invoke("generar-comprobante", {
    body: { id_pedido: idPedido },
  });
  if (error) {
    let mensaje = "No fue posible descargar el comprobante. Vuelve a intentarlo.";
    if (error.context instanceof Response) {
      try {
        const respuesta = await error.context.json();
        if (typeof respuesta?.error === "string") mensaje = respuesta.error;
      } catch { /* Se conserva el mensaje si el servidor no devuelve JSON. */ }
    }
    throw new Error(mensaje);
  }
  if (!data?.signedUrl || !data?.path) {
    throw new Error("El servidor no devolvió el comprobante.");
  }
  return data;
}
