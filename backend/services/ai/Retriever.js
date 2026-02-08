import { PrismaClient } from '@prisma/client';
import { pipeline, env } from '@xenova/transformers';
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const prisma = new PrismaClient();

// Configure Transformers.js for Vercel Serverless (Read-Only FS)
env.cacheDir = '/tmp'; 
env.allowLocalModels = false; // Force download to /tmp if not found
// Note: We bypass SSL verification validation here if needed, but in Prod Vercel it should be fine.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; 

// Singleton for Embedding Pipeline (Lazy Load)
let embeddingPipe = null;

// Singleton for Anthropic Client (Lazy Load)
let chatModel = null;

async function getEmbeddingPipe() {
    if (!embeddingPipe) {
        console.log("🔌 Loading Embedding Model...");
        embeddingPipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipe;
}

function getChatModel() {
    if (!chatModel) {
        if (!process.env.ANTHROPIC_API_KEY) {
             console.warn("⚠️ ANTHROPIC_API_KEY is missing!");
        }
        chatModel = new ChatAnthropic({
            modelName: "claude-3-haiku-20240307", // Fast & Cheap
            temperature: 0.3,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    return chatModel;
}

export async function generateSupportResponse(userQuestion) {
    try {
        console.log(`🤖 Processing question: "${userQuestion}"`);

        // 1. Generate Embedding for Question
        const pipe = await getEmbeddingPipe();
        const output = await pipe(userQuestion, { pooling: 'mean', normalize: true });
        const questionVector = Array.from(output.data);

        // 2. Vector Search in DB (Find top 3 relevant chunks)
        // Note: vector <-> vector distance (cosine similarity usually)
        // pgvector operator for cosine distance is <=>
        const results = await prisma.$queryRaw`
            SELECT id, content, metadata, 1 - (embedding <=> ${questionVector}::vector) as similarity
            FROM knowledge_base
            ORDER BY embedding <=> ${questionVector}::vector
            LIMIT 3;
        `;

        if (results.length === 0 || results[0].similarity < 0.5) {
            console.log("⚠️ No relevant knowledge found.");
            // Fallback for generic chat? Or strict RAG?
            // For now, let's allow Claude to answer generally but warn about context.
        }

        // 3. Construct Context Blob
        const contextText = results.map(r => r.content).join("\n---\n");
        console.log(`📚 Context found (${results.length} chunks):`, contextText.substring(0, 100) + "...");

        // 4. Call Claude
        const systemPrompt = `
Eres KAIU, un asistente virtual experto en aceites esenciales y bienestar natural.
Tu tono es empático, relajado y profesional. 

INSTRUCCIONES:
1. Usa SOLAMENTE la siguiente INFORMACIÓN DE CONTEXTO para responder.
2. Si la respuesta no está en el contexto, di amablemente que no tienes esa información y sugiere contactar a un humano.
3. NO inventes precios ni productos.
4. Responde en Español de Colombia (puedes usar "tú").

CONTEXTO:
${contextText}
        `;

        const response = await getChatModel().invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userQuestion),
        ]);

        return {
            text: response.content,
            sources: results.map(r => r.metadata) // return sources for debugging
        };

    } catch (error) {
        console.error("❌ Error in RAG Service:", error);
        return { text: "Lo siento, tuve un error interno procesando tu consulta. Por favor intenta más tarde." };
    }
}
