
import axios from 'axios';
import crypto from 'crypto';

// Setup
const PORT = 3001;
const URL = `http://localhost:${PORT}/api/whatsapp/webhook`;
const SECRET = process.env.WHATSAPP_APP_SECRET || 'test_secret';

// Payload similar to what Meta sends
const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "123456789",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "1234567890",
              phone_number_id: "9876543210"
            },
            messages: [
              {
                from: "573150718723", // Your test number
                id: "wamid.test." + Date.now(),
                timestamp: Date.now(),
                text: {
                  body: "Hola, ¿qué beneficios tiene la menta?"
                },
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

// Calculate X-Hub-Signature-256 (if your webhook checks it)
// Note: In local dev, validation might be skipped or needs this match.
// Our webhook.js checks signature if APP_SECRET is present.
// Let's assume we might need it.
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

async function testWebhook() {
  try {
    console.log(`🚀 Sending POST to ${URL}...`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));

    const response = await axios.post(URL, payload, {
      headers: {
        'x-hub-signature-256': `sha256=${signature}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`\n✅ Response Status: ${response.status}`);
    console.log(`Response Data:`, response.data);
  } catch (error) {
    console.error(`\n❌ Error:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    }
  }
}

testWebhook();
