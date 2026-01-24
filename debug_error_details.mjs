import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9682223'; // ID from screenshot

const checkError = async () => {
    console.log(`\n--- Checking Error for ID: ${ORDER_ID} ---`);
    
    // 1. Details
    const detRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${ORDER_ID}`, {
        headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
    });
    const det = await detRes.json();
    console.log(`Status: ${det.status}`);
    console.log(`Confirmation: ${det.confirmation_status}`);
    console.log(`Town: ${det.shipping_address?.city}, ${det.shipping_address?.region}`);
    console.log(`Address: ${det.shipping_address?.address}`);

    // 2. Try Create Shipment
    console.log("\nAttempting Create Shipment...");
    const createRes = await fetch(`https://api.venndelo.com/v1/admin/shipping/create-shipments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
        },
        body: JSON.stringify({ order_ids: [ORDER_ID] })
    });
    console.log(`Create Status: ${createRes.status}`);
    console.log(`Create Body: ${await createRes.text()}`);

    // 3. Try Generate Label
    console.log("\nAttempting Generate Label...");
    const genRes = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
        },
        body: JSON.stringify({
            order_ids: [ORDER_ID],
            format: "LABEL_10x15",
            output: "URL"
        })
    });
    const text = await genRes.text();
    console.log(`Gen Status: ${genRes.status}`);
    console.log(`Gen Body: ${text}`);
};

checkError();
