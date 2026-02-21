import crypto from 'crypto';
import fetch from 'node-fetch';
import 'dotenv/config';

// 1. Configuramos los datos a simular
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || 'test_secret';
const FROM_NUMBER = "573001234567"; // El mismo de la sesión dummy
const MESSAGE_TEXT = "¿Tienen aceite de lavanda y cuánto cuesta?";

// 2. Construimos el Payload exacto que mandaría Meta (WhatsApp)
const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1234567890",
              phone_number_id: "PHONE_NUMBER_ID"
            },
            contacts: [
              {
                profile: { name: "Cliente Prueba" },
                wa_id: FROM_NUMBER
              }
            ],
            messages: [
              {
                from: FROM_NUMBER,
                id: `wamid.test_${Date.now()}`,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: { body: MESSAGE_TEXT },
                type: "text"
              }
            ]
          },
          field: "messages"
        }
      ]
    }
  ]
};

// 3. Generamos la firma de seguridad (X-Hub-Signature-256)
const payloadString = JSON.stringify(payload);
const expectedHash = crypto
  .createHmac("sha256", APP_SECRET)
  .update(payloadString)
  .digest("hex");
const signature = `sha256=${expectedHash}`;

// 4. Enviamos la petición POST local al Webhook
console.log(`🚀 Simulando mensaje de WhatsApp de ${FROM_NUMBER}: "${MESSAGE_TEXT}"`);

async function run() {
  try {
    const response = await fetch("http://localhost:3001/api/whatsapp/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signature
      },
      body: payloadString
    });

    if (response.ok) {
      console.log("✅ Webhook recibió el mensaje correctamente (200 OK).");
      console.log("👀 Revisa tu Dashboard (http://localhost:8080/dashboard/chats) y verás la respuesta generada por la IA en tiempo real.");
    } else {
      const text = await response.text();
      console.error(`❌ Fallo en el Webhook: ${response.status} - ${text}`);
    }
  } catch (err) {
    console.error("❌ Error conectando al servidor local:", err.message);
  }
}

run();
