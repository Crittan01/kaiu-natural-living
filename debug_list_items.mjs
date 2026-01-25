import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

const checkListItems = async () => {
    console.log(`\n--- Checking Line Items in List View ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=3&status=ANY`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const data = await res.json();
        const items = data.items || data.results || [];
        
        items.forEach(o => {
            console.log(`ID: ${o.id}`);
            console.log(`Items:`, o.line_items ? JSON.stringify(o.line_items.map(i => i.name)) : "MISSING");
            console.log("------------------------------------------------");
        });

    } catch (e) { console.error(e); }
};

checkListItems();
