import { useState } from "react";
import {
  normalizarDatosFacturacion,
  sanitizarCampoFacturacion,
  validarCampoFacturacion,
  validarDatosFacturacion,
} from "../utils/facturacion/validacionFacturacion";

const FACTURA_INICIAL = {
  rut_empresa: "",
  razon_social: "",
  giro: "",
  direccion_factura: "",
  id_region: "",
  id_comuna: "",
  telefono: "",
  correo: "",
};

function useFacturacionCompra() {
  const [esFactura, setEsFactura] = useState(false);

  const [datosFactura, setDatosFactura] = useState({
    ...FACTURA_INICIAL,
  });
  const [erroresFactura, setErroresFactura] = useState({});

  function seleccionarTipoDocumento(valor) {
    const requiereFactura = valor === "factura";

    setEsFactura(requiereFactura);

    if (!requiereFactura) {
      setDatosFactura({
        ...FACTURA_INICIAL,
      });
      setErroresFactura({});
    }
  }

  function actualizarDatoFactura(campo, valor) {
    const valorSanitizado = sanitizarCampoFacturacion(campo, valor);

    setDatosFactura((actual) => ({
      ...actual,
      [campo]: valorSanitizado,
    }));

    if (erroresFactura[campo]) {
      setErroresFactura((actuales) => ({
        ...actuales,
        [campo]: validarCampoFacturacion(campo, {
          ...datosFactura,
          [campo]: valorSanitizado,
        }),
      }));
    }
  }

  function validarCampoFactura(campo) {
    const mensaje = validarCampoFacturacion(campo, datosFactura);

    setErroresFactura((actuales) => ({
      ...actuales,
      [campo]: mensaje,
    }));

    return mensaje;
  }

  function validarFactura(opciones = {}) {
    if (!esFactura) {
      return {
        valido: true,
        mensaje: "",
      };
    }

    const errores = validarDatosFacturacion(datosFactura, opciones);
    const mensajes = Object.values(errores);

    setErroresFactura(errores);

    return {
      valido: mensajes.length === 0,
      mensaje: mensajes[0] || "",
      errores,
    };
  }

  function obtenerDatosFacturacion() {
    return {
      es_factura: esFactura,

      detalle_factura: esFactura
        ? normalizarDatosFacturacion(datosFactura)
        : null,
    };
  }

  return {
    esFactura,
    datosFactura,
    erroresFactura,

    seleccionarTipoDocumento,
    actualizarDatoFactura,
    validarCampoFactura,
    validarFactura,
    obtenerDatosFacturacion,
  };
}

export default useFacturacionCompra;
