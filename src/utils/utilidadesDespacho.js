export const ID_COMUNA_PUERTO_MONTT = 313;

export const ID_RETIRO_TIENDA = 1;
export const ID_DESPACHO_URBANO = 2;
export const ID_DESPACHO_ALEDANO = 3;
export const ID_DESPACHO_COORDINAR = 4;

export function esPuertoMontt(idComuna) {
  return Number(idComuna) === ID_COMUNA_PUERTO_MONTT;
}

export function obtenerOpcionesDespachoDisponibles(
  idComuna,
  tiposDespacho = [],
) {
  if (!idComuna) {
    return [];
  }

  if (esPuertoMontt(idComuna)) {
    return tiposDespacho.filter((tipo) =>
      [ID_RETIRO_TIENDA, ID_DESPACHO_URBANO, ID_DESPACHO_ALEDANO].includes(
        Number(tipo.id_tipo_despacho),
      ),
    );
  }

  return tiposDespacho.filter(
    (tipo) => Number(tipo.id_tipo_despacho) === ID_DESPACHO_COORDINAR,
  );
}

export function obtenerDespachoAutomatico(idComuna, tiposDespacho = []) {
  if (!idComuna || esPuertoMontt(idComuna)) {
    return null;
  }

  return (
    tiposDespacho.find(
      (tipo) => Number(tipo.id_tipo_despacho) === ID_DESPACHO_COORDINAR,
    ) ?? null
  );
}

export function calcularCostoDespacho(tipoDespacho) {
  if (!tipoDespacho) {
    return 0;
  }

  const costo = Number(tipoDespacho.costo);

  if (!Number.isFinite(costo) || costo < 0) {
    return 0;
  }

  return costo;
}

export function requiereCoordinacionDespacho(tipoDespacho) {
  return tipoDespacho?.requiere_coordinacion === true;
}
