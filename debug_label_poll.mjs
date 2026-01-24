import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ORDER_ID = '9682203'; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const pollLabel = async () => {
    console.log(`\n--- Polling Label for ID: ${ORDER_ID} ---`);
    let attempts = 0;
    
    while (attempts < 20) {
        attempts++;
        console.log(`Attempt ${attempts}...`);
        
        try {
            const res = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
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

            const text = await res.text();
            console.log(`Status: ${res.status}`);
            console.log(`Body: ${text}`);

            try {
                const json = JSON.parse(text);
                if (json.status === 'SUCCESS') {
                    console.log("\n!!! SUCCESS !!!");
                    console.log("DATA PROPERTY TYPE:", typeof json.data);
                    console.log("DATA VALUE:", json.data);
                    return;
                }
            } catch (e) {}

        } catch (e) { console.error(e); }
        
        await sleep(2000);
    }
};

pollLabel();
