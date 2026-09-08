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
      costoEnvio = 0,
    } = req.body;

    // -----------------------------------------------
    // Validaciones básicas
    // -----------------------------------------------

    if (!userId) {
      return res.status(400).json({
        error: "Usuario no informado.",
      });
    }

    const costoEnvioNumero = Number(costoEnvio);

    if (
      !Number.isInteger(costoEnvioNumero) ||
      costoEnvioNumero < 0
    ) {
      return res.status(400).json({
        error: "Costo de despacho inválido.",
      });
    }

    // -----------------------------------------------
    // Crear pedido + detalle + pago
    // -----------------------------------------------

    const {
      data,
      error,
    } = await supabase.rpc(
      "crear_pedido_webpay",
      {
        p_user_id: userId,
        p_costo_envio: costoEnvioNumero,
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

    console.log("Pedido creado:", {
      idPedido: pedido.id_pedido,
      idPago: pedido.id_pago,
      buyOrder: pedido.buy_order,
      monto: pedido.monto,
    });

    // -----------------------------------------------
    // Crear transacción Webpay
    // -----------------------------------------------

    const response = await transaction.create(
      pedido.buy_order,
      userId,
      pedido.monto,
      `${BACKEND_URL}/api/webpay/return`,
    );

    console.log("Webpay creado:", {
      token: response.token,
      url: response.url,
    });

    // -----------------------------------------------
    // Inicializar pago
    // -----------------------------------------------

    const {
      error: errorInicializar,
    } = await supabase.rpc(
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

    // -----------------------------------------------
    // Responder al frontend
    // -----------------------------------------------

    return res.json({
      token: response.token,
      url: response.url,
      idPedido: pedido.id_pedido,
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

    // -----------------------------------------------
    // Sin token = cancelación
    // -----------------------------------------------

    if (!token) {
      return res.redirect(
        `${FRONTEND_URL}/pago/resultado?estado=cancelado`,
      );
    }

    try {
      // -----------------------------------------------
      // Confirmar con Transbank
      // -----------------------------------------------

      const response =
        await transaction.commit(token);

      console.log("Resultado Webpay:", {
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

      // -----------------------------------------------
      // Validar buy_order
      // -----------------------------------------------

      if (!response.buy_order) {
        throw new Error(
          "Webpay no devolvió la buy_order.",
        );
      }

      // =================================================
      // BUSCAR PAGO MEDIANTE RPC
      // =================================================

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

      // -----------------------------------------------
      // Validar monto
      // -----------------------------------------------

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

      // =================================================
      // PAGO AUTORIZADO
      // =================================================

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
              response.authorization_code ??
              null,

            p_payment_type_code:
              response.payment_type_code ??
              null,

            p_installments_number:
              response.installments_number ??
              null,

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

      // =================================================
      // PAGO RECHAZADO
      // =================================================

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