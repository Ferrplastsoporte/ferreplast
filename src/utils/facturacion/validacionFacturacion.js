import {
  sanitizarCorreo,
  validarCorreo,
} from "../comunes/correo.js";

export const LIMITES_FACTURACION = Object.freeze({
  rut_empresa: 10,
  razon_social: 120,
  giro: 100,
  direccion_factura: 160,
  telefono: 12,
});

const CAMPOS_FACTURACION = [
  "rut_empresa",
  "razon_social",
  "giro",
  "correo",
  "direccion_factura",
  "id_region",
  "id_comuna",
  "telefono",
];

function sanitizarTexto(valor, limite) {
  return String(valor ?? "")
    .normalize("NFC")
    .replace(/\p{Cc}/gu, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "")
    .slice(0, limite);
}

export function sanitizarRutFacturacion(valor = "") {
  const rutLimpio = String(valor)
    .toUpperCase()
    .replace(/[.\s]/g, "")
    .replace(/[^0-9K-]/g, "");
  const posicionGuion = rutLimpio.indexOf("-");

  if (posicionGuion === -1) {
    return rutLimpio.replace(/\D/g, "").slice(0, 8);
  }

  const cuerpo = rutLimpio
    .slice(0, posicionGuion)
    .replace(/\D/g, "")
    .slice(0, 8);
  const digitoVerificador = rutLimpio
    .slice(posicionGuion + 1)
    .replace(/[^0-9K]/g, "")
    .slice(0, 1);

  return `${cuerpo}-${digitoVerificador}`;
}

export function sanitizarTelefonoFacturacion(valor = "") {
  const texto = String(valor);
  const numeros = texto.replace(/\D/g, "").slice(0, 11);

  if (!numeros) return texto.includes("+") ? "+" : "";

  return `+${numeros}`;
}

export function sanitizarCampoFacturacion(campo, valor) {
  switch (campo) {
    case "rut_empresa":
      return sanitizarRutFacturacion(valor);
    case "razon_social":
    case "giro":
    case "direccion_factura":
      return sanitizarTexto(valor, LIMITES_FACTURACION[campo]);
    case "correo":
      return sanitizarCorreo(valor);
    case "telefono":
      return sanitizarTelefonoFacturacion(valor);
    case "id_region":
    case "id_comuna":
      return String(valor ?? "").replace(/\D/g, "").slice(0, 10);
    default:
      return valor;
  }
}

export function validarRutFacturacion(valor = "") {
  const rut = sanitizarRutFacturacion(valor);

  if (!/^\d{7,8}-[\dK]$/.test(rut)) {
    return "Ingresa un RUT válido sin puntos y con guion.";
  }

  const [cuerpo, digitoIngresado] = rut.split("-");
  let suma = 0;
  let multiplicador = 2;

  for (let indice = cuerpo.length - 1; indice >= 0; indice -= 1) {
    suma += Number(cuerpo[indice]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);
  const digitoCalculado =
    resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);

  return digitoIngresado === digitoCalculado
    ? ""
    : "El RUT de la empresa no es válido.";
}

function validarTextoRequerido(valor, etiqueta, minimo, maximo) {
  const texto = String(valor ?? "").trim();
  const caracteresInformativos = texto.match(/[\p{L}\p{N}]/gu)?.length ?? 0;

  if (!texto) return `Ingresa ${etiqueta}.`;
  if (caracteresInformativos < minimo) {
    return `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} debe contener al menos ${minimo} letras o números.`;
  }
  if (texto.length > maximo) {
    return `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} no puede superar los ${maximo} caracteres.`;
  }
  return "";
}

export function validarCampoFacturacion(campo, valores = {}) {
  const valor = valores[campo];

  switch (campo) {
    case "rut_empresa":
      return validarRutFacturacion(valor);
    case "razon_social":
      return validarTextoRequerido(
        valor,
        "la razón social",
        2,
        LIMITES_FACTURACION.razon_social,
      );
    case "giro":
      return validarTextoRequerido(
        valor,
        "el giro de la empresa",
        3,
        LIMITES_FACTURACION.giro,
      );
    case "correo":
      return validarCorreo(valor);
    case "direccion_factura":
      return validarTextoRequerido(
        valor,
        "la dirección de facturación",
        5,
        LIMITES_FACTURACION.direccion_factura,
      );
    case "id_region":
      return Number.isInteger(Number(valor)) && Number(valor) > 0
        ? ""
        : "Selecciona la región de facturación.";
    case "id_comuna":
      return Number.isInteger(Number(valor)) && Number(valor) > 0
        ? ""
        : "Selecciona la comuna de facturación.";
    case "telefono": {
      const telefono = String(valor ?? "").trim();

      if (!telefono) return "";

      return /^\+569\d{8}$/.test(telefono)
        ? ""
        : "Usa el formato +56912345678.";
    }
    default:
      return "";
  }
}

export function validarDatosFacturacion(
  valores = {},
  { comunas = [], validarRegion = true } = {},
) {
  const errores = Object.fromEntries(
    CAMPOS_FACTURACION.filter(
      (campo) => validarRegion || campo !== "id_region",
    ).map((campo) => [
      campo,
      validarCampoFacturacion(campo, valores),
    ]).filter(([, mensaje]) => Boolean(mensaje)),
  );

  if (
    validarRegion &&
    !errores.id_region &&
    !errores.id_comuna &&
    comunas.length > 0
  ) {
    const comunaValida = comunas.some(
      (comuna) =>
        Number(comuna.id_comuna) === Number(valores.id_comuna) &&
        Number(comuna.id_reg) === Number(valores.id_region),
    );

    if (!comunaValida) {
      errores.id_comuna = "La comuna no pertenece a la región seleccionada.";
    }
  }

  return errores;
}

export function normalizarDatosFacturacion(valores = {}) {
  return {
    rut_empresa: sanitizarRutFacturacion(valores.rut_empresa),
    razon_social: sanitizarCampoFacturacion(
      "razon_social",
      valores.razon_social,
    ).trim(),
    giro: sanitizarCampoFacturacion("giro", valores.giro).trim(),
    direccion_factura: sanitizarCampoFacturacion(
      "direccion_factura",
      valores.direccion_factura,
    ).trim(),
    id_comuna: Number(valores.id_comuna),
    telefono: sanitizarTelefonoFacturacion(valores.telefono) || null,
    correo: sanitizarCorreo(valores.correo),
  };
}
