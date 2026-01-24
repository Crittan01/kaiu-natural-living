import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ENV
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

const fetchOrderDetails = async (id) => {
    console.log(`\n--- Fetching Details for ID: ${id} ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders/${id}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const data = await res.json();
        console.log(`Status: ${data.status}`);
        console.log(`Confirmation Status: ${data.confirmation_status}`); // Check if it exists here
        console.log(`Payment: ${data.payment_method_code}`);
    } catch (e) { console.error(e); }
};

const scanStatuses = async () => {
    // Standard Venndelo Statuses
    const statuses = ["PENDING", "APPROVED", "READY", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "INCIDENT"];
    
    for (const s of statuses) {
        try {
            const res = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=1&status=${s}`, {
                headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
            });
            const data = await res.json();
            const count = (data.items || data.results || []).length;
            if (count > 0) {
                console.log(`Status [${s}] has orders. First ID: ${(data.items || data.results)[0].id}`);
            }
        } catch (e) {}
    }
};

(async () => {
    // await scanStatuses();
    // Assuming 9681916 is the PENDING one found earlier
    await fetchOrderDetails('32336274');
})();
