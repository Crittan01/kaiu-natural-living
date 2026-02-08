

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load ENV FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAI() {
    console.log("🧠 Testing AI Service...");
    
    // Dynamic import to ensure ENV is loaded
    const { generateSupportResponse } = await import('../backend/services/ai/Retriever.js');

    const question = "Hola, ¿qué beneficios tiene el aceite de lavanda?";
    console.log(`❓ Question: "${question}"`);

    try {
        const response = await generateSupportResponse(question);
        console.log("✅ AI Response Generated:");
        console.log(response.text);
    } catch (error) {
        console.error("❌ AI Service Failed:");
        console.error(error);
    }
}

testAI();

