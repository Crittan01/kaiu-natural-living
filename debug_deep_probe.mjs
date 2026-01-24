import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

const deepProbe = async () => {
    console.log(`\n--- Deep Probe (Page Size 100, Status ANY) ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=100&status=ANY`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        
        const data = await res.json();
        const items = data.items || data.results || [];
        
        console.log(`Total items fetched: ${items.length}`);
        
        // Group by status
        const byStatus = {};
        items.forEach(o => {
            const s = o.status;
            if (!byStatus[s]) byStatus[s] = [];
            byStatus[s].push(o);
        });

        // Print summary
        Object.keys(byStatus).forEach(s => {
            console.log(`\nSTATUS: [${s}] - Count: ${byStatus[s].length}`);
            // Print details of first 3 items in this status
            byStatus[s].slice(0, 3).forEach(o => {
                console.log(`  - ID: ${o.id} | Created: ${o.created_at} | Pay: ${o.payment_method_code} | ConfirmStatus: ${o.confirmation_status}`);
            });
        });

    } catch (e) {
        console.error(e);
    }
};

deepProbe();
