
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch'; // Using node-fetch explicitly
import https from 'https';

// Load Env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });

const key = process.env.RESEND_API_KEY;
console.log(`Key Loaded: ${key ? (key.substring(0, 5) + '...') : 'NO KEY'}`);

// Create an HTTPS Agent that ignores SSL errors
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const run = async () => {
    try {
        console.log("📨 Sending Hello World via NODE-FETCH (Insecure SSL)...");
        
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                from: 'KAIU Test <onboarding@resend.dev>',
                to: ['crittan01@gmail.com'],
                subject: 'Test Resend Insecure SSL',
                html: '<p><strong>It works via Insecure Fetch!</strong></p>'
            }),
            agent: httpsAgent
        });

        const data = await res.json();
        
        if (!res.ok) {
            console.error("API Error:", JSON.stringify(data, null, 2));
        } else {
            console.log("Success!", data);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
};

run();
