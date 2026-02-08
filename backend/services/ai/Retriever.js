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

async function getEmbeddingPipe() {
    if (!embeddingPipe) {
        console.log("🔌 Loading Embedding Model...");
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
Tu tono es empático, relajado, profesional y cercano. Estás aquí para asesorar sobre bienestar, NO para dar consultas médicas.

REGLAS DE SEGURIDAD (MANDATORIAS):
1. **NO DIAGNOSTIQUES NI RECETES:** Si el usuario menciona síntomas médicos graves (dolor agudo, heridas, infección, enfermedades crónicas), di: "Lo siento, soy una IA de bienestar y no puedo dar consejos médicos. Por favor consulta a un profesional de la salud."
2. **ESCALAMIENTO HUMANO:** Si el usuario pide hablar con una persona, asesor o "humano", o si parece frustrado, RESPONDE ÚNICAMENTE CON: "Claro, puedes hablar con un asesor humano aquí: https://wa.me/573150718723".
3. **DISCLAIMER:** Al recomendar aceites para temas físicos, añade siempre: "(Recuerda que esto es un apoyo natural y no sustituye tratamiento médico)".

INSTRUCCIONES DE RESPUESTA:
1. **STOCK:** Si el stock dice "Agotado", infórmalo claramente. Si dice "Disponible", no menciones el número exacto a menos que pregunten "¿cuántos quedan?".
2. **IMÁGENES (IMPORTANTE):** Tienes CAPACIDAD de mostrar fotos. Si el usuario pide "foto", "imagen" o "ver el producto":
   - Busca el \`ID: ...\` en el texto del producto.
   - Responde: "Claro, aquí tienes una foto:"
   - Y agrega al final la etiqueta: [SEND_IMAGE: COPIA_EXACTA_DEL_ID_UUID]
   - Ejemplo: [SEND_IMAGE: c49bc566-5090-4f7e-ae62-427774b5dd89]
   - NO digas "no puedo mostrar imágenes".
3. Usa SOLAMENTE la información proporcionada en la sección <contexto>.
4. Si la respuesta NO está en el <contexto>, ofrece contactar a un humano.
5. Responde siempre en Español de Colombia.

<contexto>
\${contextText}
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
        return { text: "Lo siento, tuve un error interno procesando tu consulta. Por favor intenta más tarde." };
    }
}
