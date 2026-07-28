// ============================
// FUNCIONES AUXILIARES
// ============================

export const normalizarEspacios = (value = "") => {
  return value.replace(/\s+/g, " ").trim();
};

/**
 * Limpia el valor antes de guardarlo en el estado.
 *
 * No reemplaza las validaciones:
 * solamente impide que entren caracteres incompatibles.
 */
export const sanitizeRegisterField = (name, value) => {
  if (typeof value !== "string") {
    return value;
  }

  switch (name) {
    case "nombre":
      return (
        value
          // Solo letras, tildes, ñ y espacios
          .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "")
          // Evita espacios repetidos
          .replace(/\s{2,}/g, " ")
          // No permite comenzar con espacio
          .replace(/^\s+/, "")
          .slice(0, 80)
      );

    case "rut": {
      let rutLimpio = value
        .toUpperCase()
        // Elimina puntos y espacios
        .replace(/[.\s]/g, "")
        // Solo números, K y guion
        .replace(/[^0-9K-]/g, "");

      /*
       * Conserva solamente el primer guion.
       */
      const posicionGuion = rutLimpio.indexOf("-");

      if (posicionGuion !== -1) {
        const cuerpo = rutLimpio
          .slice(0, posicionGuion)
          .replace(/\D/g, "")
          .slice(0, 8);

        const digitoVerificador = rutLimpio
          .slice(posicionGuion + 1)
          .replace(/[^0-9K]/g, "")
          .slice(0, 1);

        rutLimpio = `${cuerpo}-${digitoVerificador}`;
      } else {
        /*
         * Mientras todavía no escribe el guion,
         * solo se aceptan los números del cuerpo.
         */
        rutLimpio = rutLimpio.replace(/\D/g, "").slice(0, 8);
      }

      return rutLimpio;
    }

    case "email":
      return (
        value
          .toLowerCase()
          // Un correo no debe llevar espacios
          .replace(/\s/g, "")
          .slice(0, 120)
      );

    case "telefono": {
      /*
       * Solo permite un signo + al comienzo
       * y números después.
       */
      const tienePrefijo = value.startsWith("+");

      const numeros = value.replace(/\D/g, "").slice(0, 11);

      return tienePrefijo ? `+${numeros}` : numeros;
    }

    case "direccion":
      return (
        value
          // Letras, números, espacios y #
          .replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9#\s]/g, "")
          .replace(/\s{2,}/g, " ")
          .replace(/^\s+/, "")
          .slice(0, 120)
      );

    /*
     * No modificamos las contraseñas.
     * Deben admitir símbolos y espacios si la
     * configuración de autenticación lo permite.
     */
    case "password":
    case "confirmarPassword":
      return value;

    default:
      return value;
  }
};
