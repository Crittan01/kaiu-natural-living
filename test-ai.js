import 'dotenv/config';
import { generateSupportResponse } from './backend/services/ai/Retriever.js';

async function main() {
    try {
        console.log("Testing Inventory Query:");
        const res1 = await generateSupportResponse("Tienen lavanda en 10ml?");
        console.log("RESPONSE 1:", res1.text);

        console.log("\nTesting RAG/Policy Query:");
        const res2 = await generateSupportResponse("Cuánto vale el envío a Bogotá?");
        console.log("RESPONSE 2:", res2.text);

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

main();
