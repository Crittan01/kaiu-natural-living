import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9681916'; // The known 'PENDING' (Nuevo) order

const testLabel = async () => {
    console.log(`\n--- Testing Label Gen for ID: ${ORDER_ID} ---`);
    try {
        const payload = {
            order_ids: [ORDER_ID],
            format: "LABEL_10x15",
            output: "URL"
        };

        const res = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log(`HTTP Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);

    } catch (e) { console.error(e); }
};

testLabel();
