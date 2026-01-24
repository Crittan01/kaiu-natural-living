import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const PIN = '32336551';
const GUIDE = '56813972283';

const testSearch = async () => {
    console.log(`\n--- Testing Search by PIN: ${PIN} ---`);
    // Try explicit param
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?pin=${PIN}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const data = await res.json();
        console.log(`Results (pin param): ${data.items ? data.items.length : 0}`);
        if(data.items && data.items.length > 0) console.log("Found:", data.items[0].id);
    } catch(e) { console.error(e); }

    // Try search query (if supported)
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?q=${PIN}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        // Sometimes APIs use 'search' instead of 'q'
        const data = await res.json();
        console.log(`Results (q param): ${data.items ? (data.items.length || data.count) : 0}`);
    } catch(e) {}

    console.log(`\n--- Testing Search by Guide: ${GUIDE} ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?tracking_number=${GUIDE}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const data = await res.json();
        console.log(`Results (tracking_number param): ${data.items ? data.items.length : 0}`);
    } catch(e) { console.error(e); }
};

testSearch();
