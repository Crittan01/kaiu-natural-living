
import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const REFERENCE = 'KAIU-1769442896617'; // From the file we saw
const AMOUNT_IN_CENTS = 30100; // From screenshot ($30.100)
const CURRENCY = 'COP';
const STATUS = 'APPROVED';
const TIMESTAMP = Date.now().toString();

const EVENT_SECRET = process.env.WOMPI_EVENT_SECRET || process.env.WOMPI_INTEGRITY_SECRET;

if (!EVENT_SECRET) {
    console.error("❌ No hay secreto configurado en .env.local");
    process.exit(1);
}

// Mimic Wompi Payload Structure
const transaction = {
    id: `tx_${Date.now()}`,
    amount_in_cents: AMOUNT_IN_CENTS,
    reference: REFERENCE,
    currency: CURRENCY,
    status: STATUS,
    status_message: "APROBADA EN SANDBOX LOCAL"
};

const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents']; 
// Wompi default properties for checksum usually are `transaction.id + transaction.status + transaction.amount_in_cents + timestamp + secret`
// Let's verify what `api/wompi/webhook.js` expects. 
// It iterates `properties` array from signature.
// Standard Wompi signature properties:
// transaction.id
// transaction.status
// transaction.amount_in_cents

let concatenated = "";
concatenated += transaction.id;
concatenated += transaction.status;
concatenated += transaction.amount_in_cents;
concatenated += TIMESTAMP;
concatenated += EVENT_SECRET;

const checksum = crypto.createHash('sha256').update(concatenated).digest('hex');

const payload = {
    event: 'transaction.updated',
    data: {
        transaction
    },
    timestamp: parseInt(TIMESTAMP),
    environment: 'test',
    signature: {
        properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'],
        checksum,
        timestamp: parseInt(TIMESTAMP)
    }
};

console.log("🚀 Enviando Webhook Simulado...");
console.log(`Ref: ${REFERENCE}`);
console.log(`Checksum: ${checksum}`);

fetch('http://localhost:3001/api/wompi/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(async res => {
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
})
.catch(err => console.error("Error:", err));
