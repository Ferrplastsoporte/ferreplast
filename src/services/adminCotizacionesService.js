import { supabase } from "../lib/supabase";

export async function cargarCotizacionesAdmin() {
  const [resultadoCotizaciones, resultadoClientes, resultadoConfiguracion] =
    await Promise.all([
      supabase
        .from("cotizacion")
        .select(
          `
            id_cotizacion,
            id_user,
            fecha_cot,
            fecha_emision,
            fecha_validez,
            dias_validez_aplicados,
            tasa_iva_aplicada,
            subtotal_neto,
            monto_iva,
            total_bruto,
            id_medio_cont,
            comentario,
            notas_cotizacion,
            id_estado_cot,
            medio_contacto (id_medio_cont, nom_medio),
            estado_cotizacion (id_estado_cot, nom_estado),
            detalle_cotizacion (
              id_detalle_cot,
              es_producto_catalogo,
              id_prod,
              nom_producto_solicitado,
              marca_producto_solicitado,
              cantidad,
              es_cotizable,
              valor_bruto,
              producto (id_prod, nom_prod, imagen_url)
            )
          `,
        )
        .order("fecha_cot", { ascending: false }),
      supabase.rpc("obtener_clientes_cotizaciones_admin"),
      supabase.rpc("obtener_configuracion_cotizacion_admin"),
    ]);

  const error =
    resultadoCotizaciones.error ||
    resultadoClientes.error ||
    resultadoConfiguracion.error;

  if (error) throw error;

  const clientesPorCotizacion = new Map(
    (resultadoClientes.data ?? []).map((cliente) => [
      cliente.id_cotizacion,
      cliente,
    ]),
  );
  const cotizaciones = (resultadoCotizaciones.data ?? []).map(
    (cotizacion) => ({
      ...cotizacion,
      usuario: clientesPorCotizacion.get(cotizacion.id_cotizacion) ?? null,
    }),
  );

  return {
    cotizaciones,
    configuracion: resultadoConfiguracion.data?.[0] ?? null,
  };
}

async function ejecutarRpc(nombre, parametros) {
  const { data, error } = await supabase.rpc(nombre, parametros);
  if (error) throw error;
  return data?.[0] ?? null;
}

export function guardarBorradorCotizacionAdmin(
  idCotizacion,
  precios,
  notasCotizacion,
) {
  return ejecutarRpc("guardar_borrador_cotizacion_admin", {
    p_id_cotizacion: idCotizacion,
    p_precios: precios,
    p_notas_cotizacion: notasCotizacion,
  });
}

export function completarCotizacionAdmin(
  idCotizacion,
  diasValidez,
  precios,
  notasCotizacion,
) {
  return ejecutarRpc("completar_cotizacion_admin", {
    p_id_cotizacion: idCotizacion,
    p_dias_validez: diasValidez,
    p_precios: precios,
    p_notas_cotizacion: notasCotizacion,
  });
}

export function resolverResultadoCotizacionAdmin(
  idCotizacion,
  idEstadoResultado,
) {
  return ejecutarRpc("resolver_resultado_cotizacion_admin", {
    p_id_cotizacion: idCotizacion,
    p_id_estado_resultado: idEstadoResultado,
  });
}
