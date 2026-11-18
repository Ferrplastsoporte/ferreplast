import {
  sanitizarNombreUsuario,
  validarNombreUsuario,
} from "../usuarios/validacionUsuarios";
import { sanitizarCorreo, validarCorreo } from "../comunes/correo";

function sanitizarCelularPerfil(valor = "") {
  const texto = String(valor).replace(/[\s()-]/g, "");
  const digitos = texto.replace(/\D/g, "");
  const nacional = texto.startsWith("+569") ? digitos.slice(3)
    : /^569\d{8}$/.test(digitos) ? digitos.slice(3) : digitos;
  const numero = nacional.slice(0, 8);
  return numero ? "+569" + numero : "";
}

export const LIMITES_PERFIL = {
  nombre: 80,
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
    case "telefono":
      return sanitizarCelularPerfil(valor);
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
    case "telefono":
      return /^\+569\d{8}$/.test(String(valor).trim()) ? "" : "Ingresa los 8 dígitos de tu celular después de +569.";
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

export function normalizarPerfil(valores = {}) {
  return {
    nombre: sanitizarNombreUsuario(valores.nombre).trim(),
    telefono: sanitizarCelularPerfil(valores.telefono).trim(),
    direccion: sanitizarDireccionPerfil(valores.direccion).trim(),
    idComuna: Number(valores.comuna),
  };
}
