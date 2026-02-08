
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually since this is a script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Bypass SSL for local testing
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TEST_PHONE_NUMBER = '573150718723'; // User's number from previous context

console.log("🔍 Debugging WhatsApp Config:");
console.log(`- Phone ID: ${PHONE_NUMBER_ID ? '✅ Present' : '❌ MISSING'}`);
console.log(`- Token: ${ACCESS_TOKEN ? '✅ Present (' + ACCESS_TOKEN.substring(0, 10) + '...)' : '❌ MISSING'}`);
console.log(`- Target: ${TEST_PHONE_NUMBER}`);

if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("❌ Missing Credentials in .env.local");
    process.exit(1);
}

async function sendTestMessage() {
    console.log("\n🚀 Enviando mensaje de prueba a WhatsApp...");
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: TEST_PHONE_NUMBER,
                type: "template",
                template: {
                    name: "hello_world",
                    language: { code: "en_US" }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log("✅ Mensaje Enviado con Éxito!");
        console.log("Response ID:", response.data.messages[0].id);
    } catch (error) {
        console.error("❌ Error al enviar mensaje:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

sendTestMessage();
