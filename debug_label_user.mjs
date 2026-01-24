import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9682203';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const debugFlow = async () => {
    console.log(`\n--- Debugging Label for ID: ${ORDER_ID} ---`);
    
    // 1. Check current details first
    console.log("Stats check...");
    const detRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${ORDER_ID}`, {
        headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
    });
    const det = await detRes.json();
    console.log(`Current Status: ${det.status}`);
    console.log(`Shipments array length: ${det.shipments ? det.shipments.length : 0}`);

    // 2. Create Shipment
    console.log("\nStep 1: POST /create-shipments");
    const createRes = await fetch(`https://api.venndelo.com/v1/admin/shipping/create-shipments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
        },
        body: JSON.stringify({ order_ids: [ORDER_ID] })
    });
    console.log(`Status: ${createRes.status}`);
    console.log(`Body: ${await createRes.text()}`);

    console.log("\nWaiting 2s...");
    await sleep(2000);

    // 3. Generate Label (Try 1)
    console.log("\nStep 2: POST /generate-labels (Attempt 1)");
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
    console.log(`Status: ${genRes.status}`);
    console.log(`Body: ${await genRes.text()}`);
};

debugFlow();
