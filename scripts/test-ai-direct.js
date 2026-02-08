
import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually since this is a script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

// Bypass SSL for local dev (MANDATORY for Xenova model download if behind proxy/filter)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prisma = new PrismaClient();

// Singleton for Embedding Pipeline (Lazy Load)
let embeddingPipe = null;

async function getEmbeddingPipe() {
    if (!embeddingPipe) {
        console.log("🔌 Loading Embedding Model (Xenova/all-MiniLM-L6-v2)...");
        const start = Date.now();
        embeddingPipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log(`✅ Model Loaded in ${(Date.now() - start) / 1000}s`);
    }
    return embeddingPipe;
}

// Singleton for Anthropic Client
const chatModel = new ChatAnthropic({
    modelName: "claude-3-haiku-20240307", 
    temperature: 0.3,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateSupportResponse(userQuestion) {
    try {
        console.log(`🤖 Processing question: "${userQuestion}"`);
        const totalStart = Date.now();

        // 1. Generate Embedding for Question
        console.log("   -> Generating vector...");
        const pipe = await getEmbeddingPipe();
        const output = await pipe(userQuestion, { pooling: 'mean', normalize: true });
        const questionVector = Array.from(output.data);
        console.log("   -> Vector generated.");

        // 2. Vector Search in DB
        console.log("   -> Searching DB...");
        const results = await prisma.$queryRaw`
            SELECT id, content, metadata, 1 - (embedding <=> ${questionVector}::vector) as similarity
            FROM knowledge_base
            ORDER BY embedding <=> ${questionVector}::vector
            LIMIT 3;
        `;
        console.log(`   -> Found ${results.length} chunks.`);

        // 3. Construct Context Blob
        const contextText = results.map(r => r.content).join("\n---\n");
        
        // 4. Call Claude
        console.log("   -> Calling Claude...");
        const systemPrompt = `
Eres KAIU, un asistente virtual experto en aceites esenciales.
CONTEXTO:
${contextText}
        `;

        const response = await chatModel.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userQuestion),
        ]);

        console.log(`✅ Completed in ${(Date.now() - totalStart) / 1000}s`);
        return {
            text: response.content,
            sources: results.map(r => r.metadata) 
        };

    } catch (error) {
        console.error("❌ Error in RAG Service:", error);
        return { text: "Error interno." };
    }
}

// Run Test directly
(async () => {
    console.log("🚀 Starting Direct AI Test...");
    const result = await generateSupportResponse("¿Tienen aceite de lavanda y para qué sirve?");
    console.log("\n💬 AI Reply:\n", result.text);
    process.exit(0);
})();
