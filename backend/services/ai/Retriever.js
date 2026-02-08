import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const prisma = new PrismaClient();

// Singleton for Embedding Pipeline (Lazy Load)
let embeddingPipe = null;

// Bypass SSL for local dev (Fixes Anthropic & Xenova fetch errors)
// Note: This matches the behavior needed for this environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Configure Xenova to use /tmp for cache (Critical for Vercel Serverless)
import { env } from '@xenova/transformers';
env.localModelPath = '/tmp/xenova-models';
env.cacheDir = '/tmp/xenova-cache';
env.allowLocalModels = false; // Force download if not present

async function getEmbeddingPipe() {
    if (!embeddingPipe) {
        console.log("🔌 Loading Embedding Model...");
        // Use a smaller quantized model if possible, or sticking to MiniLM
        embeddingPipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embeddingPipe;
}

// Singleton for Anthropic Client (Lazy Load)
let chatModel = null;

function getChatModel() {
    if (!chatModel) {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY is not set");
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
    const TIMEOUT_MS = 9000; // 9 seconds (just under Vercel 10s default)
    
    const aiPromise = (async () => {
        try {
            console.log(`🤖 Processing question: "${userQuestion}"`);

            // 1. Generate Embedding for Question
            const pipe = await getEmbeddingPipe();
            const output = await pipe(userQuestion, { pooling: 'mean', normalize: true });
            const questionVector = Array.from(output.data);

            // 2. Vector Search in DB (Find top 3 relevant chunks)
            const results = await prisma.$queryRaw`
                SELECT id, content, metadata, 1 - (embedding <=> ${questionVector}::vector) as similarity
                FROM knowledge_base
                ORDER BY embedding <=> ${questionVector}::vector
                LIMIT 3;
            `;

            if (results.length === 0 || results[0].similarity < 0.5) {
                console.log("⚠️ No relevant knowledge found.");
            }

            // 3. Construct Context Blob
            const contextText = results.map(r => r.content).join("\n---\n");
            console.log(`📚 Context found (${results.length} chunks):`, contextText.substring(0, 100) + "...");

            // 4. Call Claude
            const systemPrompt = `
Eres KAIU, un asistente virtual experto en aceites esenciales y bienestar natural.
Tu tono es empático, relajado, profesional y cercano. Estás aquí para asesorar, no solo para vender.

INSTRUCCIONES CLAVE:
1. Usa SOLAMENTE la información proporcionada en la sección <contexto>.
2. Si la respuesta NO está en el <contexto>, di amablemente: "Lo siento, no tengo esa información específica en este momento. ¿Te gustaría que contacte a un humano del equipo KAIU por ti?".
3. NO inventes precios, inventarios ni beneficios que no aparezcan en el texto.
4. Responde SIEMPRE en Español de Colombia (puedes usar "tú").
5. Si encuentras múltiples productos relevantes, menciónalos con sus precios.
6. Sé conciso pero útil. Evita parrafadas gigantes; usa listas (bullets) si hay mucha información.

FORMATO DE LOS DATOS QUE RECIBES:
Los datos vienen etiquetados como [PRODUCTO] o [PREGUNTA FRECUENTE]. Úsalos para diferenciar si te preguntan por un artículo o una política de la tienda.

<contexto>
${contextText}
</contexto>
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
            throw error; // Let the wrapper catch it or return fallback
        }
    })();

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            console.warn("⚠️ AI Generation Timed Out (Vercel Limit)");
            resolve({ 
                text: "¡Hola! Estoy despertando un poco lento (mis servidores están fríos 🥶). Por favor, pregúntame de nuevo en 10 segundos y te responderé de inmediato. 🙏",
                timedOut: true 
            });
        }, TIMEOUT_MS);
    });

    try {
        return await Promise.race([aiPromise, timeoutPromise]);
    } catch (error) {
        return { text: "Lo siento, tuve un error interno. Por favor intenta más tarde." };
    }
}
