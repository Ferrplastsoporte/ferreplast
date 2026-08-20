export const TIPOS_IMAGEN_MARCA = ["image/jpeg", "image/png", "image/webp"];

export const TAMANO_MAXIMO_LOGO_MARCA = 2 * 1024 * 1024;

export const LONGITUD_MINIMA_MARCA = 2;
export const LONGITUD_MAXIMA_MARCA = 80;

export function limpiarNombreMarca(valor = "") {
  return String(valor)
    .replace(/[^\p{L}\p{N}\s&.'’\-]/gu, "")
    .replace(/\s{2,}/g, " ");
}

export function validarNombreMarca(nombre) {
  const nombreLimpio = limpiarNombreMarca(nombre).trim();

  if (!nombreLimpio) {
    return {
      valido: false,
      error: "Debes ingresar el nombre de la marca.",
      valor: "",
    };
  }

  if (nombreLimpio.length < LONGITUD_MINIMA_MARCA) {
    return {
      valido: false,
      error: `El nombre debe tener al menos ${LONGITUD_MINIMA_MARCA} caracteres.`,
      valor: nombreLimpio,
    };
  }

  if (nombreLimpio.length > LONGITUD_MAXIMA_MARCA) {
    return {
      valido: false,
      error: `El nombre no puede superar los ${LONGITUD_MAXIMA_MARCA} caracteres.`,
      valor: nombreLimpio,
    };
  }

  return {
    valido: true,
    error: "",
    valor: nombreLimpio,
  };
}

export function validarLogoMarca(archivo) {
  if (!archivo) {
    return {
      valido: true,
      error: "",
    };
  }

  if (!TIPOS_IMAGEN_MARCA.includes(archivo.type)) {
    return {
      valido: false,
      error: "El logo debe estar en formato JPG, PNG o WEBP.",
    };
  }

  if (archivo.size > TAMANO_MAXIMO_LOGO_MARCA) {
    return {
      valido: false,
      error: "El logo no puede superar los 2 MB.",
    };
  }

  return {
    valido: true,
    error: "",
  };
}

export function obtenerExtensionLogoMarca(archivo) {
  const extensionOriginal = archivo.name.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "webp"].includes(extensionOriginal)) {
    return extensionOriginal === "jpeg" ? "jpg" : extensionOriginal;
  }

  switch (archivo.type) {
    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return "jpg";
  }
}
