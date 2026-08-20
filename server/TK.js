import express from "express";
import cors from "cors";
import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
  Environment,
} from "transbank-sdk";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transaction = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration,
  ),
);

app.post("/api/webpay/create", async (req, res) => {
  try {
    const { amount, sessionId } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: "Monto inválido." });
    }

    const buyOrder = `FP${Date.now()}`;

    const response = await transaction.create(
      buyOrder,
      sessionId || "ferreplast",
      amount,
      "http://localhost:3000/api/webpay/return",
    );

    res.json({
      token: response.token,
      url: response.url,
    });
  } catch (error) {
    console.error("Error creando pago:", error);
    res.status(500).json({ error: "No se pudo iniciar el pago." });
  }
});

app.all("/api/webpay/return", async (req, res) => {
  const token = req.body?.token_ws || req.query.token_ws;

  if (!token) {
    return res.redirect(
      "http://localhost:5173/pago/resultado?estado=cancelado",
    );
  }

  try {
    const response = await transaction.commit(token);
    
    console.log("Resultado Webpay:", {
      status: response.status,
      responseCode: response.responseCode,
      buyOrder: response.buyOrder,
    });
    const aprobado =
      response.status === "AUTHORIZED" &&
      response.responseCode === 0;

    res.redirect(
      `http://localhost:5173/pago/resultado?estado=${
        aprobado ? "aprobado" : "rechazado"
      }`,
    );
  } catch (error) {
    console.error("Error confirmando pago:", error);
    res.redirect(
      "http://localhost:5173/pago/resultado?estado=error",
    );
  }
});

app.listen(3000, () => {
  console.log("Webpay backend: http://localhost:3000");
});