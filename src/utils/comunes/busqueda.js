export const LONGITUD_MAXIMA_BUSQUEDA = 100;

export function sanitizarTerminoBusqueda(valor = "") {
  return String(valor)
    .normalize("NFC")
    .replace(/\p{Cc}/gu, "")
    .slice(0, LONGITUD_MAXIMA_BUSQUEDA);
}

export function normalizarTerminoBusqueda(valor = "") {
  return sanitizarTerminoBusqueda(valor).replace(/\s{2,}/g, " ").trim();
}

export function crearPatronBusquedaIlike(valor = "") {
  const termino = normalizarTerminoBusqueda(valor);
  const terminoEscapado = termino.replace(/[\\%_]/g, "\\$&");

  return `%${terminoEscapado}%`;
}
