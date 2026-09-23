import {
  sanitizarNombreUsuario,
  sanitizarRutUsuario,
  sanitizarTelefonoUsuario,
  validarNombreUsuario,
  validarRutUsuario,
  validarTelefonoUsuario,
} from "../usuarios/validacionUsuarios";
import { sanitizarCorreo, validarCorreo } from "../comunes/correo";

export const LIMITES_PERFIL = {
  nombre: 80,
  rut: 10,
  telefono: 12,
  direccion: 120,
};

const PATRON_DIRECCION = /^[\p{L}\p{M}\d\s#.,'\u2019°/-]+$/u;

export function sanitizarDireccionPerfil(valor = "") {
  return String(valor)
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\d\s#.,'\u2019°/-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "")
    .slice(0, LIMITES_PERFIL.direccion);
}

export function validarDireccionPerfil(valor = "") {
  const direccion = String(valor).trim();

  if (direccion.length < 5) {
    return "Ingresa una dirección de al menos 5 caracteres.";
  }

  if (direccion.length > LIMITES_PERFIL.direccion) {
    return `La dirección no puede superar los ${LIMITES_PERFIL.direccion} caracteres.`;
  }

  if (!PATRON_DIRECCION.test(direccion)) {
    return "La dirección contiene caracteres no permitidos.";
  }

  return "";
}

export function validarSeleccionPerfil(valor, etiqueta) {
  const id = Number(valor);

  return Number.isInteger(id) && id > 0
    ? ""
    : `Selecciona una ${etiqueta} válida.`;
}

export function sanitizarCampoPerfil(nombre, valor) {
  switch (nombre) {
    case "nombre":
      return sanitizarNombreUsuario(valor);
    case "rut":
      return sanitizarRutUsuario(valor);
    case "telefono":
      return sanitizarTelefonoUsuario(valor);
    case "direccion":
      return sanitizarDireccionPerfil(valor);
    case "correo":
      return sanitizarCorreo(valor);
    case "region":
    case "comuna":
      return String(valor ?? "").replace(/\D/g, "");
    default:
      return valor;
  }
}

export function validarCampoPerfil(nombre, valor) {
  switch (nombre) {
    case "nombre":
      return validarNombreUsuario(valor);
    case "rut":
      return validarRutUsuario(valor);
    case "telefono":
      return validarTelefonoUsuario(valor);
    case "direccion":
      return validarDireccionPerfil(valor);
    case "region":
      return validarSeleccionPerfil(valor, "región");
    case "comuna":
      return validarSeleccionPerfil(valor, "comuna");
    case "correo":
      return validarCorreo(valor);
    default:
      return "";
  }
}

export function validarPerfilCompleto(valores = {}) {
  const campos = [
    "nombre",
    "rut",
    "telefono",
    "direccion",
    "region",
    "comuna",
  ];

  return Object.fromEntries(
    campos
      .map((campo) => [campo, validarCampoPerfil(campo, valores[campo])])
      .filter(([, mensaje]) => Boolean(mensaje)),
  );
}

export function normalizarPerfil(valores = {}) {
  return {
    nombre: sanitizarNombreUsuario(valores.nombre).trim(),
    rut: sanitizarRutUsuario(valores.rut),
    telefono: sanitizarTelefonoUsuario(valores.telefono).trim(),
    direccion: sanitizarDireccionPerfil(valores.direccion).trim(),
    idComuna: Number(valores.comuna),
  };
}

