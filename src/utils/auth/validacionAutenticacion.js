import {
  esCorreoValido,
  sanitizarCorreo,
} from "../comunes/correo";

export const isValidEmail = esCorreoValido;

// El formato se completa al salir del campo o enviar, nunca al escribir.
export const normalizarRutRegistro = (valor = "") => {
  const rut = sanitizeRegisterField("rut", String(valor));
  return /^\d{7,8}[0-9K]$/.test(rut)
    ? rut.slice(0, -1) + "-" + rut.slice(-1)
    : rut;
};

export const normalizarTelefonoRegistro = (valor = "") => {
  const numero = sanitizeRegisterField("telefono", String(valor));
  return numero ? "+569" + numero : "";
};

export const isValidRut = (rut = "") => {
  const rutLimpio = normalizarRutRegistro(rut);

  const partes = rutLimpio.split("-");

  if (partes.length !== 2) {
    return false;
  }

  const [cuerpo, digitoIngresado] = partes;

  if (!/^\d{7,8}$/.test(cuerpo) || Number(cuerpo) === 0) {
    return false;
  }

  if (!/^[0-9K]$/.test(digitoIngresado)) {
    return false;
  }

  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);

  const digitoCalculado =
    resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);

  return digitoIngresado === digitoCalculado;
};

export const isValidPhone = (phone) => {
  return /^\+569\d{8}$/.test(phone);
};

export const isValidPassword = (password) => {
  if (password.length < 8) {
    return false;
  }

  if (!/[A-Z]/.test(password)) {
    return false;
  }

  if (!/[a-z]/.test(password)) {
    return false;
  }

  if (!/[0-9]/.test(password)) {
    return false;
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }

  return true;
};

export const isValidName = (name) => {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(name);
};

export const isValidAddress = (address) => {
  const formatoValido =
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#]+)*$/.test(
      address,
    );

  return formatoValido && address.length >= 5;
};

/**
 * Limpia los campos del registro antes de guardarlos en el estado.
 * Esta limpieza complementa las validaciones, pero no las reemplaza.
 */
export const sanitizeRegisterField = (name, value) => {
  if (typeof value !== "string") {
    return value;
  }

  switch (name) {
    case "nombre":
      return value
        .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, 80);

    case "rut":
      // No recortar: borrar el guion no debe borrar el verificador.
      return value
        .toUpperCase()
        .replace(/[\u2010-\u2015\u2212\uFE63\uFF0D]/g, "-")
        .replace(/[.\s]/g, "");

    case "email":
      return sanitizarCorreo(value);

    case "telefono": {
      const numero = value.replace(/[\s()-]/g, "");
      // Aceptar el número completo pegado o autocompletado.
      if (numero.startsWith("+569")) return numero.slice(4);
      if (/^569\d{8}$/.test(numero)) return numero.slice(3);
      return numero;
    }

    case "direccion":
      return value
        .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#\s]/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/^\s+/, "")
        .slice(0, 120);

    case "password":
    case "confirmarPassword":
    default:
      return value;
  }
};

// ============================
// VALIDACIÓN DEL REGISTRO
// ============================

export const validateRegisterField = (name, value, form) => {
  const val = typeof value === "string" ? value.trim() : value;

  switch (name) {
    case "nombre":
      if (!val) {
        return "Debes ingresar tu nombre y apellidos.";
      }

      if (val.length < 3) {
        return "El nombre debe tener al menos 3 caracteres.";
      }

      if (!isValidName(val)) {
        return "El nombre solo puede contener letras y espacios.";
      }

      return "";

    case "rut":
      if (!val) {
        return "Debes ingresar tu RUT.";
      }

      if (!/^\d{7,8}-[0-9K]$/.test(normalizarRutRegistro(val))) {
        return "Ingresa el RUT completo con su dígito verificador. Ejemplo: 12345678-5.";
      }

      if (!isValidRut(val)) {
        return "El RUT ingresado no es válido.";
      }

      return "";

    case "email":
      if (!val) {
        return "Debes ingresar tu correo electrónico.";
      }

      if (!isValidEmail(val)) {
        return "Ingresa un correo electrónico válido.";
      }

      return "";

    case "password":
      if (!value) {
        return "Debes crear una contraseña.";
      }

      if (!isValidPassword(value)) {
        return "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.";
      }

      return "";

    case "confirmarPassword":
      if (!value) {
        return "Debes repetir la contraseña.";
      }

      if (value !== form.password) {
        return "Las contraseñas no coinciden.";
      }

      return "";

    case "direccion":
      if (!val) {
        return "Debes ingresar tu dirección.";
      }

      if (val.length < 5) {
        return "Ingresa una dirección más completa.";
      }

      if (!isValidAddress(val)) {
        return "La dirección solo puede contener letras, números, espacios y #.";
      }

      return "";

    case "telefono":
      if (!val) {
        return "Debes ingresar tu número de teléfono.";
      }

      if (!isValidPhone(normalizarTelefonoRegistro(val))) {
        return "Ingresa los 8 dígitos de tu celular después de +569.";
      }

      return "";

    case "region":
      if (!val) {
        return "Debes seleccionar una región.";
      }

      return "";

    case "comuna":
      if (!val) {
        return "Debes seleccionar una comuna.";
      }

      return "";

    case "rol":
      if (!val) {
        return "Debes seleccionar un rol.";
      }

      if (!["bodeguero", "vendedor", "admin"].includes(val)) {
        return "El rol seleccionado no es válido.";
      }

      return "";

    case "estado":
      if (!val) {
        return "Debes seleccionar un estado.";
      }

      if (!["activo", "inactivo"].includes(val)) {
        return "El estado seleccionado no es válido.";
      }

      return "";

    default:
      return "";
  }
};
