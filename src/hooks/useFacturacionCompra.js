import { useState } from "react";

const FACTURA_INICIAL = {
  rut_empresa: "",
  razon_social: "",
  giro: "",
  direccion_factura: "",
  id_comuna: "",
  telefono: "",
  correo: "",
};

function useFacturacionCompra() {
  const [esFactura, setEsFactura] = useState(false);

  const [datosFactura, setDatosFactura] = useState({
    ...FACTURA_INICIAL,
  });

  function seleccionarTipoDocumento(valor) {
    const requiereFactura = valor === "factura";

    setEsFactura(requiereFactura);

    if (!requiereFactura) {
      setDatosFactura({
        ...FACTURA_INICIAL,
      });
    }
  }

  function actualizarDatoFactura(campo, valor) {
    setDatosFactura((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function validarFactura() {
    if (!esFactura) {
      return {
        valido: true,
        mensaje: "",
      };
    }

    if (!datosFactura.rut_empresa.trim()) {
      return {
        valido: false,
        mensaje: "Ingresa el RUT de la empresa.",
      };
    }

    if (!datosFactura.razon_social.trim()) {
      return {
        valido: false,
        mensaje: "Ingresa la razón social.",
      };
    }

    if (!datosFactura.giro.trim()) {
      return {
        valido: false,
        mensaje: "Ingresa el giro de la empresa.",
      };
    }

    if (!datosFactura.direccion_factura.trim()) {
      return {
        valido: false,
        mensaje: "Ingresa la dirección de facturación.",
      };
    }

    if (!datosFactura.id_comuna) {
      return {
        valido: false,
        mensaje: "Selecciona la comuna de facturación.",
      };
    }

    if (!datosFactura.correo.trim()) {
      return {
        valido: false,
        mensaje: "Ingresa el correo de facturación.",
      };
    }

    return {
      valido: true,
      mensaje: "",
    };
  }

  function obtenerDatosFacturacion() {
    return {
      es_factura: esFactura,

      detalle_factura: esFactura
        ? {
            rut_empresa: datosFactura.rut_empresa.trim(),
            razon_social: datosFactura.razon_social.trim(),
            giro: datosFactura.giro.trim(),
            direccion_factura: datosFactura.direccion_factura.trim(),

            id_comuna: Number(datosFactura.id_comuna),

            telefono: datosFactura.telefono.trim() || null,

            correo: datosFactura.correo.trim(),
          }
        : null,
    };
  }

  return {
    esFactura,
    datosFactura,

    seleccionarTipoDocumento,
    actualizarDatoFactura,
    validarFactura,
    obtenerDatosFacturacion,
  };
}

export default useFacturacionCompra;
