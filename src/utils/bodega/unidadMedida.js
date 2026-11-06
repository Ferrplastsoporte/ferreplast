export const LONGITUD_MINIMA_UNIDAD = 1;
export const LONGITUD_MAXIMA_UNIDAD = 40;

export function limpiarNombreUnidad(valor = "") {
  return String(valor)
    .replace(/[^\p{L}\p{N}\s²³]/gu, "")
    .replace(/\s{2,}/g, " ");
}

export function normalizarNombreUnidad(valor = "") {
  return String(valor).trim().toLocaleLowerCase("es-CL");
}

export function validarNombreUnidad(
  nombre,
  unidades = [],
  idUnidadEditando = null,
) {
  const nombreLimpio = limpiarNombreUnidad(nombre).trim();

  if (!nombreLimpio) {
    return {
      valido: false,
      error: "Debes ingresar el nombre de la unidad de medida.",
      valor: "",
    };
  }

  if (nombreLimpio.length < LONGITUD_MINIMA_UNIDAD) {
    return {
      valido: false,
      error: `El nombre debe tener al menos ${LONGITUD_MINIMA_UNIDAD} carácter.`,
      valor: nombreLimpio,
    };
  }

  if (nombreLimpio.length > LONGITUD_MAXIMA_UNIDAD) {
    return {
      valido: false,
      error: `El nombre no puede superar los ${LONGITUD_MAXIMA_UNIDAD} caracteres.`,
      valor: nombreLimpio,
    };
  }

  if (!/[\p{L}\p{N}]/u.test(nombreLimpio)) {
    return {
      valido: false,
      error: "La unidad debe contener al menos una letra o un número.",
      valor: nombreLimpio,
    };
  }

  const nombreNormalizado = normalizarNombreUnidad(nombreLimpio);

  const unidadDuplicada = unidades.some(
    (unidad) =>
      Number(unidad.id_und_medida) !== Number(idUnidadEditando) &&
      normalizarNombreUnidad(unidad.nom_und_medida) === nombreNormalizado,
  );

  if (unidadDuplicada) {
    return {
      valido: false,
      error: "Ya existe una unidad de medida con ese nombre.",
      valor: nombreLimpio,
    };
  }

  return {
    valido: true,
    error: "",
    valor: nombreLimpio,
  };
}
