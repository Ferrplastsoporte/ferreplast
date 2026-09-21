export const LONGITUD_MAXIMA_CORREO = 120;

const PATRON_PARTE_LOCAL = /^[A-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+$/i;
const PATRON_ETIQUETA_DOMINIO = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;

export function sanitizarCorreo(valor = "") {
  return String(valor)
    .toLowerCase()
    .replace(/\s/g, "")
    .slice(0, LONGITUD_MAXIMA_CORREO);
}

export function esCorreoValido(valor = "") {
  const correo = sanitizarCorreo(valor);
  const partes = correo.split("@");

  if (partes.length !== 2) return false;

  const [parteLocal, dominio] = partes;

  if (
    !parteLocal ||
    parteLocal.length > 64 ||
    parteLocal.startsWith(".") ||
    parteLocal.endsWith(".") ||
    parteLocal.includes("..") ||
    !PATRON_PARTE_LOCAL.test(parteLocal)
  ) {
    return false;
  }

  const etiquetasDominio = dominio.split(".");

  return (
    dominio.length <= 253 &&
    etiquetasDominio.length >= 2 &&
    etiquetasDominio.every((etiqueta) =>
      PATRON_ETIQUETA_DOMINIO.test(etiqueta),
    )
  );
}

export function validarCorreo(valor = "") {
  const correo = sanitizarCorreo(valor);

  if (!correo) return "Debes ingresar tu correo electrónico.";
  if (!esCorreoValido(correo)) return "Ingresa un correo electrónico válido.";

  return "";
}
