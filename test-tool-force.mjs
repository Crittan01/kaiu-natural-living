import { generateSupportResponse } from './backend/services/ai/Retriever.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.log("Testing TEA TREE request...");
    const res = await generateSupportResponse("Hola y tienes Aceite de Árbol de Té?", []);
    console.log("FINAL ANSWER:\n", res.text);
}
test().catch(console.error);
