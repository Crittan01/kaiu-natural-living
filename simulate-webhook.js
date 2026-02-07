import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SECRET = process.env.WOMPI_INTEGRITY_SECRET;
const PORT = 3001; // API Port

if (!SECRET) {
    console.error("❌ No WOMPI_INTEGRITY_SECRET found in .env.local");
    process.exit(1);
}

async function testWebhook() {
    const transactionId = "TEST-TRX-" + Date.now();
    const reference = "KAIU-999999999"; // Non-existent ID to avoid messing up real data
    const amount = 5000000; // $50.000
    const status = "APPROVED";
    const timestamp = Date.now().toString();

    const integrityString = `${transactionId}${status}${amount}${timestamp}${SECRET}`;
    const checksum = crypto.createHash('sha256').update(integrityString).digest('hex');

    const payload = {
        data: {
            transaction: {
                id: transactionId,
                reference: reference,
                amount_in_cents: amount,
                currency: "COP",
                status: status
            }
        },
        signature: {
            checksum: checksum
        },
        timestamp: timestamp
    };

    console.log("🚀 Sending Webhook...");
    const start = performance.now();

    try {
        const res = await fetch(`http://localhost:${PORT}/api/wompi/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const end = performance.now();
        const duration = end - start;
        
        const json = await res.json();

        console.log(`📡 Response Status: ${res.status}`);
        console.log(`⏱️ Response Time: ${duration.toFixed(2)}ms`);
        console.log(`📄 Body:`, json);

        if (res.status === 200 && duration < 500) {
            console.log("✅ SUCCESS: Webhook responded immediately (< 500ms).");
            console.log("ℹ️ Check server logs to see if 'Procesando en Background' appears AFTER this response.");
        } else {
            console.error("❌ FAILURE: Response too slow or invalid status.");
        }

    } catch (error) {
        console.error("❌ Network Error:", error.message);
    }
}

testWebhook();
