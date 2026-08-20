export const LONGITUD_MINIMA_FAMILIA = 2;
export const LONGITUD_MAXIMA_FAMILIA = 80;

export function limpiarNombreFamilia(valor = "") {
  return String(valor)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validarNombreFamilia(nombre, tipo = "nombre") {
  const nombreLimpio = limpiarNombreFamilia(nombre);

  if (!nombreLimpio) {
    return {
      valido: false,
      error: `Debes ingresar el ${tipo}.`,
      valor: "",
    };
  }

  if (nombreLimpio.length < LONGITUD_MINIMA_FAMILIA) {
    return {
      valido: false,
      error: `El nombre debe tener al menos ${LONGITUD_MINIMA_FAMILIA} caracteres.`,
      valor: nombreLimpio,
    };
  }

  if (nombreLimpio.length > LONGITUD_MAXIMA_FAMILIA) {
    return {
      valido: false,
      error: `El nombre no puede superar los ${LONGITUD_MAXIMA_FAMILIA} caracteres.`,
      valor: nombreLimpio,
    };
  }

  return {
    valido: true,
    error: "",
    valor: nombreLimpio,
  };
}
