import { supabase } from "../lib/supabase";
import { normalizarTerminoBusqueda } from "../utils/comunes/busqueda";

function numeroOpcional(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new Error("Hay un filtro numérico inválido.");
  return numero;
}

export async function buscarProductosCatalogo({
  filtros = {}, pagina = 1, tamanoPagina = 20, signal,
} = {}) {
  let consulta = supabase.rpc("buscar_productos_catalogo", {
    p_busqueda: normalizarTerminoBusqueda(filtros.busqueda),
    p_filtros: {
      id_familia: numeroOpcional(filtros.familia),
      id_subcategoria: numeroOpcional(filtros.subcategoria),
      id_marca: numeroOpcional(filtros.marca),
      color: filtros.color || null,
      id_und_medida: numeroOpcional(filtros.unidadMedida),
      peso: numeroOpcional(filtros.peso),
      precio_minimo: numeroOpcional(filtros.precioMinimo),
      precio_maximo: numeroOpcional(filtros.precioMaximo),
    },
    p_orden: filtros.orden || "recientes",
    p_pagina: pagina,
    p_tamano_pagina: tamanoPagina,
  });
  if (signal) consulta = consulta.abortSignal(signal);
  const { data, error } = await consulta;
  if (error) throw error;
  if (!data || !Array.isArray(data.productos) ||
    !Number.isSafeInteger(data.total) || data.total < 0) {
    throw new Error("La búsqueda devolvió una respuesta no válida.");
  }
  return data;
}


async function leerOpciones(tabla, columnas, clave, signal, soloPublicados = false) {
  const opciones = [];
  const tamanoLote = 1000;
  for (let desde = 0; ; desde += tamanoLote) {
    let consulta = supabase.from(tabla).select(columnas).order(clave)
      .range(desde, desde + tamanoLote - 1);
    if (soloPublicados) consulta = consulta.eq("est_prod", 2);
    if (signal) consulta = consulta.abortSignal(signal);
    const { data, error } = await consulta;
    if (error) throw error;
    opciones.push(...(data ?? []));
    if (!data || data.length < tamanoLote) return opciones;
  }
}

export async function obtenerOpcionesCatalogo(signal) {
  const [familias, subcategorias, marcas, unidadesMedida, productos] = await Promise.all([
    leerOpciones("familia", "id_familia, nom_familia", "id_familia", signal),
    leerOpciones("subcategoria", "id_subcategoria, nom_subcategoria, id_familia", "id_subcategoria", signal),
    leerOpciones("marca_producto", "id_marca, nom_marca", "id_marca", signal),
    leerOpciones("unidad_medida", "id_und_medida, nom_und_medida", "id_und_medida", signal),
    leerOpciones("producto", "id_prod, color_prod, peso_prod, id_und_medida", "id_prod", signal, true),
  ]);
  return { familias, subcategorias, marcas, unidadesMedida, productos };
}
