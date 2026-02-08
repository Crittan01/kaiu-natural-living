
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ENV
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const TO_PHONE = '573150718723'; // The number used in previous logs/context

async function sendTestMessage() {
    console.log("🚀 Testing WhatsApp Send...");
    console.log(`Phone ID: ${PHONE_NUMBER_ID}`);
    console.log(`To: ${TO_PHONE}`);

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
        console.error("❌ Missing Credentials in .env.local");
        return;
    }

    try {
        const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`;
        const payload = {
            messaging_product: "whatsapp",
            to: TO_PHONE,
            type: "template",
            template: {
                name: "hello_world",
                language: { code: "en_US" }
            }
        };

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ Message Sent Successfully!");
        console.log("Response:", response.data);
    } catch (error) {
        console.error("❌ Send Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

sendTestMessage();
