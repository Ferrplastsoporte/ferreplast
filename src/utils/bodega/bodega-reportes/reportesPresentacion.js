// Presentación local: no modifica los datos ni los estados guardados en Supabase.
export function nombreComposicion(valor) {
  return ({ Catálogo: 'Solo del catálogo', Externa: 'Solo externos', Mixta: 'Catálogo + externos' })[valor] ?? valor;
}

const COLORES = {
  Pendiente: '#db8b18', Completada: '#2563eb', Exitosa: '#12956d', Fallida: '#d35462',
  'Solo del catálogo': '#2563eb', 'Solo externos': '#8b6bc4', 'Catálogo + externos': '#12956d',
};
const ALTERNATIVOS = ['#2563eb', '#12956d', '#8b6bc4', '#db8b18', '#d35462'];

export function segmentosAnillo(puntos) {
  const valores = puntos.map((p) => ({ ...p, valor: Math.max(0, Number(p.valor) || 0) }));
  const total = valores.reduce((s, p) => s + p.valor, 0);
  let offset = 0;
  const segmentos = valores.map((p, i) => {
    const porcentaje = total ? p.valor / total * 100 : 0;
    const segmento = { ...p, porcentaje, offset, color: COLORES[p.etiqueta] ?? ALTERNATIVOS[i % ALTERNATIVOS.length] };
    offset += porcentaje;
    return segmento;
  });
  return { total, segmentos };
}

export function tarjetasComerciales(tipo, vista, indicadores, datos) {
  const nombres = {
    'Pendientes actuales': 'Por completar',
    'Con productos externos': 'Con productos externos',
    'Solicitudes con esta demanda': 'Solicitudes',
    'Solicitados por varios clientes': 'Demanda recurrente',
    'Monto de productos vendidos': 'Monto vendido',
  };
  return indicadores.map((k) => {
    if (tipo === 'cotizaciones' && vista === 'seguimiento' && k.titulo === 'Éxito entre resueltas') {
      const exitosas = datos.filter((d) => Number(d.id_estado_cot) === 4).length;
      const resueltas = datos.filter((d) => [3, 4].includes(Number(d.id_estado_cot))).length;
      return { titulo: 'Exitosas', valor: exitosas, tipo: 'numero', detalle: resueltas ? `${exitosas} de ${resueltas} resueltas · ${Math.round(exitosas / resueltas * 100)} %` : 'Sin cotizaciones resueltas' };
    }
    return { ...k, titulo: nombres[k.titulo] ?? k.titulo, detalle: undefined };
  });
}
