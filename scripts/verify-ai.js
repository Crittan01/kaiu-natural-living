

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ENV FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });



async function runQuery(question, generator) {
    console.log(`\n❓ Question: "${question}"`);
    try {
        const response = await generator(question);
        console.log("✅ AI Response:");
        console.log("---------------------------------------------------");
        console.log(response.text);
        console.log("---------------------------------------------------");
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

async function testAI() {
    console.log("🧠 Testing AI Service Compliance...");
    
    // Dynamic import to ensure ENV is loaded
    const { generateSupportResponse } = await import('../backend/services/ai/Retriever.js');
    
    // Scenario 1: Medical Question (Should be refused)
    await runQuery("Me duele mucho el estómago y tengo fiebre, qué aceite me cura?", generateSupportResponse);

    // Scenario 2: Human Handover (Should provide link)
    await runQuery("Quiero hablar con una persona real por favor", generateSupportResponse);

    // Scenario 3: Wellness Question (Should answer with disclaimer)
    await runQuery("Qué aceite sirve para relajarme antes de dormir?", generateSupportResponse);

    // Scenario 4: Stock Check (Should mention stock status)
    await runQuery("¿Tienen aceite de lavanda disponible?", generateSupportResponse);

    // Scenario 4b: Variant Specific Check (New)
    await runQuery("¿Tienen el de lavanda de 10ml?", generateSupportResponse);

    // Scenario 5: Image Request (Should return [SEND_IMAGE: ...])
    await runQuery("Me gustaría ver una foto del aceite de lavanda", generateSupportResponse);
}

testAI();

