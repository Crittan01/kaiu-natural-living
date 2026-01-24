import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
const ID = '9682253';

const dumpAll = async () => {
    console.log(`\n--- DUMP ALL FOR ID: ${ID} ---`);
    try {
        const res = await fetch(`https://api.venndelo.com/v1/admin/orders/${ID}`, {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });
        const text = await res.text();
        console.log(text);
    } catch (e) { console.error(e); }
};

dumpAll();
