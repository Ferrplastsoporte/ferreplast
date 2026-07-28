export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidRut = (rut = "") => {
  const rutLimpio = rut.replace(/\./g, "").replace(/\s/g, "").toUpperCase();

  const partes = rutLimpio.split("-");

  if (partes.length !== 2) {
    return false;
  }

  const [cuerpo, digitoIngresado] = partes;

  if (!/^\d+$/.test(cuerpo)) {
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

      if (!/^\d{7,8}-[\dkK]$/.test(val)) {
        return "Usa el formato sin puntos y con guion. Ejemplo: 12345678-5.";
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

      if (!isValidPhone(val)) {
        return "Usa el formato +56912345678, sin espacios ni guiones.";
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

    /*
     * Estos campos solo existen cuando mode="admin".
     * Sus valores iniciales ya vienen definidos, pero igualmente
     * los validamos por seguridad.
     */

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
