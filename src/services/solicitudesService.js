import { supabase } from "../lib/supabase";

const CATALOGOS_CAMBIOS = {
  est_prod: {
    tabla: "estado_producto",
    id: "id_est_prod",
    nombre: "nom_est_prod",
  },
  id_marca: {
    tabla: "marca_producto",
    id: "id_marca",
    nombre: "nom_marca",
  },
  id_subcategoria: {
    tabla: "subcategoria",
    id: "id_subcategoria",
    nombre: "nom_subcategoria",
  },
  id_und_medida: {
    tabla: "unidad_medida",
    id: "id_und_medida",
    nombre: "nom_und_medida",
  },
};

function obtenerIds(cambios, campo) {
  const ids = new Set();

  for (const cambio of cambios) {
    const valores = cambio?.campos_modificados?.[campo];

    for (const valor of [valores?.anterior, valores?.nuevo]) {
      if (valor !== null && valor !== undefined && valor !== "") {
        ids.add(valor);
      }
    }
  }

  return [...ids];
}

export async function obtenerNombresReferenciasCambios(cambios = []) {
  const catalogos = await Promise.all(
    Object.entries(CATALOGOS_CAMBIOS).map(
      async ([campo, { tabla, id, nombre }]) => {
        const ids = obtenerIds(cambios, campo);
        if (ids.length === 0) return [campo, {}];

        const { data, error } = await supabase
          .from(tabla)
          .select(`${id}, ${nombre}`)
          .in(id, ids);

        if (error) throw error;

        return [
          campo,
          Object.fromEntries(
            (data ?? []).map((registro) => [
              String(registro[id]),
              registro[nombre],
            ]),
          ),
        ];
      },
    ),
  );

  return Object.fromEntries(catalogos);
}
