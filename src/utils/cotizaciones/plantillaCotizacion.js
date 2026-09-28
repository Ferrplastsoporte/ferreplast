const CAMPOS_REQUERIDOS = [
  ["razon_social", "razón social"],
  ["actividad_comercial", "actividad comercial"],
  ["direccion_empresa", "dirección"],
  ["departamento_emisor", "departamento emisor"],
  ["forma_pago_predeterminada", "forma de pago"],
];

const CAMPOS_PLANTILLA = [
  "razon_social",
  "actividad_comercial",
  "direccion_empresa",
  "telefono_empresa",
  "correo_empresa",
  "departamento_emisor",
  "forma_pago_predeterminada",
  "nombre_elaborador",
  "cargo_elaborador",
  "nombre_autorizador",
  "cargo_autorizador",
  "texto_pie_pagina",
  "correo_pie_pagina",
];

const TIPOS_IMAGEN_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO_IMAGEN = 2 * 1024 * 1024;

export function crearFormularioPlantilla(plantilla = {}) {
  return Object.fromEntries(
    CAMPOS_PLANTILLA.map((campo) => [campo, String(plantilla[campo] ?? "")]),
  );
}

export function prepararPlantillaParaGuardar(formulario = {}) {
  const datos = crearFormularioPlantilla(formulario);
  CAMPOS_PLANTILLA.forEach((campo) => {
    datos[campo] = datos[campo].trim();
  });
  return datos;
}

export function validarPlantillaCotizacion(formulario = {}) {
  const faltante = CAMPOS_REQUERIDOS.find(
    ([campo]) => !String(formulario[campo] ?? "").trim(),
  );

  return faltante ? `Completa el campo ${faltante[1]}.` : "";
}

export function validarImagenPlantilla(archivo) {
  if (!archivo) return "Selecciona una imagen.";

  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
    return "Utiliza una imagen PNG, JPG o WebP.";
  }

  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return "La imagen no puede superar los 2 MB.";
  }

  return "";
}
