import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9682241';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const debug9682241 = async () => {
    console.log(`\n--- Debugging ID: ${ORDER_ID} ---`);
    
    // 1. Create Shipment
    console.log("Step 1: Create Shipment");
    const res1 = await fetch(`https://api.venndelo.com/v1/admin/shipping/create-shipments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
        },
        body: JSON.stringify({ order_ids: [ORDER_ID] })
    });
    console.log(`Create Status: ${res1.status}`);
    console.log(`Create Body: ${await res1.text()}`);

    await sleep(2000);

    // 2. Generate Label
    console.log("\nStep 2: Generate Label");
    const res2 = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
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
    console.log(`Gen Status: ${res2.status}`);
    const text = await res2.text();
    console.log(`Gen Body: ${text}`);
};

debug9682241();
