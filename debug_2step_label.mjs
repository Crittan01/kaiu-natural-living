import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9681916';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const twoStepFlow = async () => {
    console.log(`\n--- 2-Step Label Gen for ID: ${ORDER_ID} ---`);
    
    // Step 1: Create Shipment
    console.log("Step 1: Creating Shipment...");
    try {
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
    } catch (e) { console.error(e); }

    // Step 2: Wait
    console.log("Waiting 3 seconds...");
    await sleep(3000);

    // Step 3: Generate Label
    console.log("Step 3: Generating Label...");
    try {
        const payload = {
            order_ids: [ORDER_ID],
            format: "LABEL_10x15",
            output: "URL"
        };
        const res2 = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            },
            body: JSON.stringify(payload)
        });
        console.log(`Gen Status: ${res2.status}`);
        console.log(`Gen Body: ${await res2.text()}`);
    } catch (e) { console.error(e); }
};

twoStepFlow();
