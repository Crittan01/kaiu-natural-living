import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ENV
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

if (!VENNDELO_API_KEY) {
    console.error("No VENNDELO_API_KEY found.");
    process.exit(1);
}

const fetchOrders = async (status) => {
    console.log(`\n--- Fetching Status: ${status} ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=10&status=${status}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        
        if (!res.ok) {
            console.error(`Error ${res.status}:`, await res.text());
            return;
        }

        const data = await res.json();
        const items = data.items || data.results || [];
        
        console.log(`Count: ${items.length}`);
        items.forEach(o => {
            console.log(`- ID: ${o.id}`);
            console.log(`  Status: ${o.status}`);
            console.log(`  Confirmation? ${JSON.stringify(o.confirmation_status)} (if exists)`); // Checking if this field exists
            console.log(`  Payment Method: ${o.payment_method_code}`);
            console.log(`  Created: ${o.created_at}`);
        });

    } catch (e) {
        console.error(e);
    }
};

(async () => {
    await fetchOrders('PENDING');
    await fetchOrders('READY');
    await fetchOrders('ANY');
})();
