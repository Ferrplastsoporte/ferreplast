export const ROLES_USUARIO = Object.freeze({
  CLIENTE: 0,
  ADMINISTRADOR: 1,
  BODEGUERO: 2,
});

export function normalizarRolUsuario(rol) {
  const rolNormalizado = Number(rol);

  return Number.isInteger(rolNormalizado) ? rolNormalizado : null;
}

export function obtenerRutaInicialPorRol(rol) {
  switch (normalizarRolUsuario(rol)) {
    case ROLES_USUARIO.ADMINISTRADOR:
      return "/admin";

    case ROLES_USUARIO.BODEGUERO:
      return "/bodeguero";

    case ROLES_USUARIO.CLIENTE:
    default:
      return "/";
  }
}

export function estaAutorizadoPorRol(rol, rolesPermitidos = []) {
  const rolNormalizado = normalizarRolUsuario(rol);

  return rolesPermitidos.some(
    (rolPermitido) => normalizarRolUsuario(rolPermitido) === rolNormalizado,
  );
}
