// Estas referencias se usan para estadísticas; no sustituyen una cuenta ni una FK.
const uuidValido = (valor) => typeof valor === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);

export async function cargarResponsablesHistoricos(supabase, desde, hastaExclusivo) {
  const filas = [];
  const tamano = 500;
  for (let inicio = 0; ; inicio += tamano) {
    const { data, error } = await supabase.from("pedido")
      .select("id_pedido, identidad_bodeguero")
      .is("id_bodeguero", null)
      .not("identidad_bodeguero", "is", null)
      .gte("fecha_predido", desde)
      .lt("fecha_predido", hastaExclusivo)
      .order("id_pedido", { ascending: true })
      .range(inicio, inicio + tamano - 1);
    if (error) throw error;
    const pagina = data ?? [];
    filas.push(...pagina);
    if (pagina.length < tamano) return filas;
  }
}

export function prepararEquipoHistorico(integrantes, pedidos, historicos, incluirHistorico) {
  const porPedido = new Map((historicos ?? []).map((p) => [String(p.id_pedido), p.identidad_bodeguero]));
  const personasPorId = new Map((integrantes ?? []).map((p) => [p.id_user, p]));
  const operaciones = (pedidos ?? []).map((p) => {
    if (p.id_bodeguero) return { ...p, referencia_responsable: p.id_bodeguero };
    const identidad = porPedido.get(String(p.id_pedido));
    if (!incluirHistorico(p) || identidad?.version !== 1 || !uuidValido(identidad?.id_usuario)) {
      return { ...p, referencia_responsable: null };
    }
    const referencia = identidad.id_usuario;
    if (!personasPorId.has(referencia)) {
      personasPorId.set(referencia, {
        id_user: referencia,
        nom_user: identidad.nombre || "Responsable sin nombre",
        rol_user: null, est_user: false, cuenta_eliminada: true,
      });
    }
    return { ...p, referencia_responsable: referencia };
  });
  return { personasDetalle: [...personasPorId.values()], operaciones };
}
