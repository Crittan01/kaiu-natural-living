import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

const checkListShipments = async () => {
    console.log(`\n--- Checking Shipments in List View ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=5&status=ANY`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const data = await res.json();
        const items = data.items || data.results || [];
        
        items.forEach(o => {
            console.log(`ID: ${o.id} | Status: ${o.status}`);
            console.log(`Shipments Array:`, JSON.stringify(o.shipments));
            console.log("------------------------------------------------");
        });

    } catch (e) { console.error(e); }
};

checkListShipments();
