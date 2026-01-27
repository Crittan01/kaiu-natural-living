import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });

const WEBHOOK_URL = 'http://localhost:3001/api/wompi/webhook';
const SECRET = process.env.WOMPI_INTEGRITY_SECRET;

if (!SECRET) {
    console.error("❌ WOMPI_INTEGRITY_SECRET missing in .env.local");
    process.exit(1);
}

const generateSignature = (id, status, amount, timestamp) => {
    const raw = `${id}${status}${amount}${timestamp}${SECRET}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
};

const simulateEvent = async (status, amount = 5000000, desc = "Test Transaction") => {
    const id = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = Date.now();
    const signature = generateSignature(id, status, amount, timestamp);

    const payload = {
        data: {
            transaction: {
                id,
                reference: `KAIU-REF-${Date.now()}`,
                amount_in_cents: amount,
                currency: "COP",
                status,
                customer_email: "test@kaiu.co",
                payment_method_type: "CARD",
                redirect_url: "http://localhost:3000/callback"
            }
        },
        signature: {
            checksum: signature,
            properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents", "timestamp", "secret"] 
        },
        timestamp,
        environment: "test"
    };

    console.log(`\n🚀 Simulating ${status} [${desc}]...`);
    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        const icon = res.ok ? '✅' : '❌';
        console.log(`${icon} Status: ${res.status}`);
        console.log(`   Response:`, data);
    } catch (err) {
        console.error("❌ Refused/Error:", err.message);
    }
};

const runSuite = async () => {
    console.log("⚡ Starting Wompi Webhook Stress Test");
    
    // 1. Approved Payment (Happy Path)
    await simulateEvent("APPROVED", 12000000, "Purchase of Essential Oils Kit");
    
    // 2. Declined Payment (Insufficient Funds)
    await simulateEvent("DECLINED", 500000, "Card Declined");
    
    // 3. Voided Transaction
    await simulateEvent("VOIDED", 8000000, "Voided by Merchant");
    
    // 4. Error Transaction
    await simulateEvent("ERROR", 100000, "Gateway Error");
    
    // 5. Tampered Signature (Security Test)
    console.log(`\n🦹 Simulating Signature Attack (Tampered Data)...`);
    const id = `HACK-${Date.now()}`;
    const timestamp = Date.now();
    // Valid signature for 5000...
    let signature = generateSignature(id, "APPROVED", 500000, timestamp);
    // ...but we send 1000 (trying to pay less)
    const payload = {
        data: { transaction: { id, reference: `HACK-REF`, amount_in_cents: 1000, currency: "COP", status: "APPROVED" } }, // Modified amount
        signature: { checksum: signature },
        timestamp
    };
    
    try {
        const res = await fetch(WEBHOOK_URL, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload)
        });
        console.log(`Shield Status: ${res.status === 400 || res.status === 422 ? '✅ PROTECTED' : '❌ VULNERABLE'} (Code ${res.status})`);
        console.log(`   Response:`, await res.json());
    } catch(e) { console.error(e.message); }
};

runSuite();
