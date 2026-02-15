import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

console.log(`Loading env from ${envPath}`);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key && !key.startsWith('#')) {
                process.env[key] = value;
            }
        }
    });
}

import { generateSupportResponse } from '../backend/services/ai/Retriever.js';

// Mock chat history
let chatHistory = [];

async function generateResponse(userQuestion) {
    console.log(`\n--- User: "${userQuestion}" ---`);
    const response = await generateSupportResponse(userQuestion, chatHistory);
    
    console.log(`Sara: ${response.text}`);
    if (response.product) {
        console.log(`[Product Card: ${response.product.title}]`);
    }

    // Update history
    chatHistory.push({ role: 'user', content: userQuestion });
    chatHistory.push({ role: 'assistant', content: response.text });
}

async function testFlow() {
    console.log("🧪 Starting Chat Flow Test (Human Persona)...\n");

    // --- Turn 1: User asks for Lavanda ---
    await generateResponse("Hola, tienes aceite esencial de lavanda?");

    // --- Turn 2: User asks for price (Implicit) ---
    await generateResponse("que precio tiene el de 30ml?");

    // --- Turn 3: User switches to Vegetable Oil (Specific) ---
    await generateResponse("y tienen aceite vegetal de lavanda?");

    // --- Turn 4: User challenges the single option ---
    // Assuming context returns only one size for Vegetable Lavender
    await generateResponse("solo goteros de 30ml?"); 
    
    console.log("\n✅ Test Complete.");
}

testFlow().catch(console.error);
