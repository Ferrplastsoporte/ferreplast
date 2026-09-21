import {
  esCorreoValido,
  sanitizarCorreo,
} from "../comunes/correo";

const LONGITUD_MINIMA_NOMBRE = 3;
const LONGITUD_MAXIMA_NOMBRE = 80;

const PATRON_NOMBRE = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const PATRON_TELEFONO = /^\+569\d{8}$/;
const PATRON_RUT = /^\d{7,8}-[\dK]$/;

export function sanitizarNombreUsuario(valor = "") {
  return String(valor)
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\s'\u2019-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "")
    .slice(0, LONGITUD_MAXIMA_NOMBRE);
}

export function sanitizarRutUsuario(valor = "") {
  return String(valor)
    .toUpperCase()
    .replace(/[.\s]/g, "")
    .replace(/[^0-9K-]/g, "")
    .slice(0, 10);
}

export function sanitizarCorreoUsuario(valor = "") {
  return sanitizarCorreo(valor);
}

export function sanitizarTelefonoUsuario(valor = "") {
  const texto = String(valor);
  const numeros = texto.replace(/\D/g, "").slice(0, 11);

  if (!numeros) {
    return texto.includes("+") ? "+" : "";
  }

  return `+${numeros}`;
}

export function validarNombreUsuario(valor = "") {
  const nombre = String(valor).trim();

  if (nombre.length < LONGITUD_MINIMA_NOMBRE) {
    return "Ingresa el nombre y apellidos.";
  }

  if (nombre.length > LONGITUD_MAXIMA_NOMBRE) {
    return `El nombre no puede superar los ${LONGITUD_MAXIMA_NOMBRE} caracteres.`;
  }

  if (!PATRON_NOMBRE.test(nombre)) {
    return "El nombre solo puede contener letras, espacios, apóstrofes y guiones.";
  }

  return "";
}

export function validarRutUsuario(valor = "") {
  const rut = sanitizarRutUsuario(valor);

  if (!PATRON_RUT.test(rut)) {
    return "Ingresa un RUT válido sin puntos y con guion.";
  }

  const [numero, digitoIngresado] = rut.split("-");
  let suma = 0;
  let multiplicador = 2;

  for (let indice = numero.length - 1; indice >= 0; indice -= 1) {
    suma += Number(numero[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  const digitoCalculado =
    resto === 11 ? "0" : resto === 10 ? "K" : String(resto);

  return digitoCalculado === digitoIngresado
    ? ""
    : "El RUT ingresado no es válido.";
}

export function validarCorreoUsuario(valor = "") {
  const correo = sanitizarCorreoUsuario(valor);

  if (!esCorreoValido(correo)) {
    return "Ingresa un correo electrónico válido.";
  }

  return "";
}

export function validarTelefonoUsuario(valor = "") {
  return PATRON_TELEFONO.test(String(valor).trim())
    ? ""
    : "El teléfono debe tener el formato +56912345678.";
}

export function validarRolUsuario(valor, rolesPermitidos = []) {
  const rol = Number(valor);
  const rolesNormalizados = rolesPermitidos.map(Number);

  return Number.isInteger(rol) && rolesNormalizados.includes(rol)
    ? ""
    : "Selecciona un rol válido.";
}

export function validarUsuarioAdministrativo(
  valores,
  { modo = "editar", rolesPermitidos = [1, 2] } = {},
) {
  const errores = {
    nombre: validarNombreUsuario(valores?.nombre),
    telefono: validarTelefonoUsuario(valores?.telefono),
    rol: validarRolUsuario(valores?.rol, rolesPermitidos),
  };

  if (modo === "crear") {
    errores.rut = validarRutUsuario(valores?.rut);
    errores.email = validarCorreoUsuario(valores?.email);
  }

  return Object.fromEntries(
    Object.entries(errores).filter(([, mensaje]) => Boolean(mensaje)),
  );
}

export function normalizarUsuarioAdministrativo(valores = {}) {
  return {
    ...valores,
    nombre: sanitizarNombreUsuario(valores.nombre).trim(),
    rut: sanitizarRutUsuario(valores.rut),
    email: sanitizarCorreoUsuario(valores.email),
    telefono: sanitizarTelefonoUsuario(valores.telefono),
    rol: String(valores.rol ?? ""),
  };
}
