import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const TARGET_REF = "KAIU-1769202214966";

const searchAll = async () => {
    console.log(`\n--- Searching for Ref: ${TARGET_REF} ---`);
    let pageToken = "";
    let found = false;
    let pages = 0;

    while (!found && pages < 10) { // Limit to 10 pages for safety
        const url = `https://api.venndelo.com/v1/admin/orders?page_size=100&status=ANY${pageToken ? `&page_token=${pageToken}` : ''}`;
        console.log(`Fetching Page ${pages + 1}...`);
        
        try {
            const res = await fetch(url, { headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY } });
            const data = await res.json();
            const items = data.items || data.results || [];
            
            if (items.length === 0) break;

            for (const o of items) {
                if (o.source_order_id === TARGET_REF || o.external_order_id === TARGET_REF || JSON.stringify(o).includes(TARGET_REF)) {
                    console.log(`\n!!! MATCH FOUND !!!`);
                    console.log(`ID: ${o.id}`);
                    console.log(`Status: ${o.status}`);
                    console.log(`Source Order ID: ${o.source_order_id}`);
                    console.log(`External Order ID: ${o.external_order_id}`);
                    console.log(`Confirmation Status: ${o.confirmation_status}`);
                    found = true;
                    break;
                }
            }
            
            pageToken = data.next_page_token;
            pages++;
            if (!pageToken) break;

        } catch (e) {
            console.error(e);
            break;
        }
    }
    
    if (!found) console.log("No match found in first 1000 orders.");
};

searchAll();
