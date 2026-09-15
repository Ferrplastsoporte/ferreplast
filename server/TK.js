import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import express from "express";
import cors from "cors";

import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} from "transbank-sdk";

import { createClient } from "@supabase/supabase-js";

// ======================================================
// CARGAR .ENV DE LA RAÍZ DEL PROYECTO
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// ======================================================
// CONFIGURACIÓN
// ======================================================

const app = express();

const FRONTEND_URL = "http://localhost:5173";
const BACKEND_URL = "http://localhost:3000";

// ======================================================
// VALIDAR VARIABLES DE ENTORNO
// ======================================================

if (!process.env.VITE_SUPABASE_URL) {
  console.error("❌ Falta VITE_SUPABASE_URL en el .env");
  process.exit(1);
}

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  console.error("❌ Falta VITE_SUPABASE_ANON_KEY en el .env");
  process.exit(1);
}

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// SUPABASE
// ======================================================

// Cliente general
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

// ======================================================
// WEBPAY
// ======================================================

const transaction = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration,
  ),
);

// ======================================================
// CREAR TRANSACCIÓN WEBPAY
// ======================================================

app.post("/api/webpay/create", async (req, res) => {
  try {
    const {
      userId,
      accessToken,
      idTipoDespacho,
      idComuna,
      direccionDespacho,
      esFactura = false,
      facturacion = null,
    } = req.body;

    // ==================================================
    // DEBUG
    // ==================================================

    console.log("=================================");
    console.log("DATOS RECIBIDOS DEL FRONTEND:");
    console.log({
      userId,
      accessToken: accessToken ? "RECIBIDO" : "NO RECIBIDO",
      idTipoDespacho,
      idComuna,
      direccionDespacho,
      esFactura,
      facturacion,
    });
    console.log("=================================");

    // ==================================================
    // VALIDACIONES BÁSICAS
    // ==================================================

    if (!userId) {
      return res.status(400).json({
        error: "Usuario no informado.",
      });
    }

    if (!accessToken) {
      return res.status(401).json({
        error: "Sesión de usuario no informada.",
      });
    }

    if (!idTipoDespacho) {
      return res.status(400).json({
        error: "Tipo de despacho no informado.",
      });
    }

    if (!idComuna) {
      return res.status(400).json({
        error: "Comuna no informada.",
      });
    }

    if (
      Number(idTipoDespacho) !== 1 &&
      (!direccionDespacho || !direccionDespacho.trim())
    ) {
      return res.status(400).json({
        error: "Dirección de despacho no informada.",
      });
    }

    if (typeof esFactura !== "boolean") {
      return res.status(400).json({
        error: "El valor de esFactura es inválido.",
      });
    }

    // ==================================================
    // CLIENTE SUPABASE CON JWT DEL USUARIO
    // ==================================================

    const supabaseUsuario = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );

    // ==================================================
    // VERIFICAR USUARIO AUTENTICADO
    // ==================================================

    const {
      data: {
        user: usuarioAuth,
      },
      error: errorAuth,
    } = await supabaseUsuario.auth.getUser();

    if (errorAuth || !usuarioAuth) {
      console.error("Error verificando usuario:", errorAuth);

      return res.status(401).json({
        error: "Sesión de usuario inválida o expirada.",
      });
    }

    // ==================================================
    // SEGURIDAD:
    // EL USER ID DEL BODY DEBE COINCIDIR CON AUTH.UID()
    // ==================================================

    if (usuarioAuth.id !== userId) {
      console.error("Usuario no coincide:", {
        userIdBody: userId,
        userIdAuth: usuarioAuth.id,
      });

      return res.status(403).json({
        error: "El usuario no coincide con la sesión autenticada.",
      });
    }

    console.log("Usuario autenticado correctamente:", usuarioAuth.id);

    // ==================================================
    // CREAR PEDIDO + DETALLE + DESPACHO
    // + FACTURA + PAGO
    // ==================================================

    const {
      data,
      error,
    } = await supabaseUsuario.rpc(
      "crear_pedido_webpay",
      {
        p_user_id: userId,
        p_id_tipo_despacho: Number(idTipoDespacho),
        p_id_comuna: Number(idComuna),
        p_direccion_despacho:
          direccionDespacho?.trim() || null,
        p_es_factura: esFactura,
        p_facturacion: facturacion,
      },
    );

    if (error) {
      console.error(
        "Error en crear_pedido_webpay:",
        error,
      );

      return res.status(400).json({
        error: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(500).json({
        error: "No se pudo crear el pedido.",
      });
    }

    const pedido = data[0];

    console.log("==========================================");
    console.log("Pedido creado:");
    console.log({
      idPedido: pedido.id_pedido,
      idPago: pedido.id_pago,
      buyOrder: pedido.buy_order,
      monto: pedido.monto,
    });
    console.log("==========================================");

    // ==================================================
    // CREAR TRANSACCIÓN WEBPAY
    // ==================================================

    const response = await transaction.create(
      pedido.buy_order,
      userId,
      Number(pedido.monto),
      `${BACKEND_URL}/api/webpay/return`,
    );

    console.log("Webpay creado:", {
      token: response.token,
      url: response.url,
    });

    // ==================================================
    // INICIALIZAR PAGO
    // ==================================================

    const {
      error: errorInicializar,
    } = await supabaseUsuario.rpc(
      "inicializar_pago_webpay",
      {
        p_id_pago: pedido.id_pago,
        p_token_ws: response.token,
        p_session_id: userId,
      },
    );

    if (errorInicializar) {
      console.error(
        "Error inicializando pago:",
        errorInicializar,
      );

      return res.status(500).json({
        error: "No se pudo inicializar el pago.",
      });
    }

    // ==================================================
    // RESPONDER AL FRONTEND
    // ==================================================

    return res.json({
      token: response.token,
      url: response.url,
      idPedido: pedido.id_pedido,
      idPago: pedido.id_pago,
      buyOrder: pedido.buy_order,
      monto: pedido.monto,
    });

  } catch (error) {
    console.error(
      "Error creando transacción Webpay:",
      error,
    );

    return res.status(500).json({
      error: "No se pudo iniciar el pago.",
    });
  }
});

// ======================================================
// RETORNO DE WEBPAY
// ======================================================

app.all(
  "/api/webpay/return",
  async (req, res) => {
    const token =
      req.body?.token_ws ||
      req.query?.token_ws;

    // ==================================================
    // SIN TOKEN = CANCELACIÓN
    // ==================================================

    if (!token) {
      console.log(
        "Webpay retornó sin token. Pago cancelado.",
      );

      return res.redirect(
        `${FRONTEND_URL}/pago/resultado?estado=cancelado`,
      );
    }

    try {

      // ==================================================
      // CONFIRMAR CON TRANSBANK
      // ==================================================

      const response =
        await transaction.commit(token);

      console.log("==========================================");
      console.log("Resultado Webpay:");
      console.log({
        status: response.status,
        responseCode:
          response.response_code,
        buyOrder:
          response.buy_order,
        amount:
          response.amount,
        authorizationCode:
          response.authorization_code,
        paymentTypeCode:
          response.payment_type_code,
        installmentsNumber:
          response.installments_number,
      });
      console.log("==========================================");

      // ==================================================
      // VALIDAR BUY ORDER
      // ==================================================

      if (!response.buy_order) {
        throw new Error(
          "Webpay no devolvió la buy_order.",
        );
      }

      // ==================================================
      // BUSCAR PAGO MEDIANTE RPC
      // ==================================================

      const {
        data: pagos,
        error: errorPago,
      } = await supabase.rpc(
        "obtener_pago_webpay",
        {
          p_buy_order:
            response.buy_order,
        },
      );

      if (errorPago) {
        console.error(
          "Error buscando pago:",
          errorPago,
        );

        throw new Error(
          "No se pudo consultar el pago asociado a la compra.",
        );
      }

      if (
        !pagos ||
        pagos.length === 0
      ) {
        throw new Error(
          "No se encontró el pago asociado a la compra.",
        );
      }

      const pago = pagos[0];

      console.log("Pago encontrado:", {
        idPago: pago.id_pago,
        idPedido: pago.id_pedido,
        monto: pago.monto_pago,
      });

      // ==================================================
      // VALIDAR MONTO
      // ==================================================

      if (
        Number(response.amount) !==
        Number(pago.monto_pago)
      ) {
        console.error(
          "Monto Webpay no coincide:",
          {
            webpay: response.amount,
            bd: pago.monto_pago,
          },
        );

        return res.redirect(
          `${FRONTEND_URL}/pago/resultado?estado=error`,
        );
      }

      // ==================================================
      // PAGO AUTORIZADO
      // ==================================================

      const aprobado =
        response.status === "AUTHORIZED" &&
        Number(response.response_code) === 0;

      if (aprobado) {

        const {
          error: errorConfirmacion,
        } = await supabase.rpc(
          "confirmar_pedido_webpay",
          {
            p_id_pedido:
              pago.id_pedido,

            p_token_ws:
              token,

            p_estado_transbank:
              response.status,

            p_response_code:
              Number(response.response_code),

            p_authorization_code:
              response.authorization_code ?? null,

            p_payment_type_code:
              response.payment_type_code ?? null,

            p_installments_number:
              response.installments_number ?? null,

            p_card_last4:
              null,
          },
        );

        if (errorConfirmacion) {
          console.error(
            "Error confirmando pedido:",
            errorConfirmacion,
          );

          return res.redirect(
            `${FRONTEND_URL}/pago/resultado?estado=error`,
          );
        }

        console.log(
          `Pedido ${pago.id_pedido} confirmado correctamente.`,
        );

        return res.redirect(
          `${FRONTEND_URL}/pago/resultado?estado=aprobado&pedido=${pago.id_pedido}`,
        );
      }

      // ==================================================
      // PAGO RECHAZADO
      // ==================================================

      const {
        error: errorRechazo,
      } = await supabase.rpc(
        "rechazar_pedido_webpay",
        {
          p_id_pedido:
            pago.id_pedido,

          p_token_ws:
            token,

          p_estado_transbank:
            response.status ?? null,

          p_response_code:
            response.response_code ?? null,
        },
      );

      if (errorRechazo) {
        console.error(
          "Error registrando rechazo:",
          errorRechazo,
        );

        return res.redirect(
          `${FRONTEND_URL}/pago/resultado?estado=error`,
        );
      }

      console.log(
        `Pedido ${pago.id_pedido} rechazado.`,
      );

      return res.redirect(
        `${FRONTEND_URL}/pago/resultado?estado=rechazado&pedido=${pago.id_pedido}`,
      );

    } catch (error) {

      console.error(
        "Error procesando retorno Webpay:",
        error,
      );

      return res.redirect(
        `${FRONTEND_URL}/pago/resultado?estado=error`,
      );
    }
  },
);

// ======================================================
// SERVIDOR
// ======================================================

app.listen(3000, () => {

  console.log(
    "==========================================",
  );

  console.log(
    "Backend Ferreplast/Webpay iniciado",
  );

  console.log(
    `Backend: ${BACKEND_URL}`,
  );

  console.log(
    `Frontend: ${FRONTEND_URL}`,
  );

  console.log(
    "Supabase configurado correctamente",
  );

  console.log(
    "==========================================",
  );
});