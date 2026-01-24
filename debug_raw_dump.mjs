import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

const dumpOrder = async (id) => {
    console.log(`\n--- DUMPING ID: ${id} ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders/${id}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        
        console.log(`HTTP Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);

    } catch (e) { console.error(e); }
};

(async () => {
    await dumpOrder('32336274');
})();
