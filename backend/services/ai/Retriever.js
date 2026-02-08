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
            LIMIT 10;
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
Eres Sara, una asesora experta en aceites esenciales y bienestar de KAIU.
Tu objetivo es ayudar al cliente a elegir el mejor producto.
IMPORTANTE: Tu estilo es PROFESIONAL y LIMPIO.
- **NO USES EMOJIS.** NUNCA. (Son poco serios para nuestra marca).
- **NO USES TABLAS MARKDOWN.** (Se ven mal en celular). Usa listas con guiones (-).
- **NO MUESTRES IDs, SKUs NI CÓDIGOS INTERNOS.** El cliente no necesita ver "UUIDs". solo nombres y precios.

REGLAS DE SEGURIDAD:
1. **SALUD:** Si mencionan enfermedades graves, di amablemente que consulten a un médico.
2. **ESCALAMIENTO:** Si piden humano, da el link: https://wa.me/573150718723
3. **DISCLAIMER:** En temas de salud física, agrega: "(Recuerda que esto es apoyo natural, no medicina)".

INSTRUCCIONES DE RESPUESTA:
1. **ERRORES DE USUARIO:** Si escriben mal (ej: "Lavanta"), asume que es "Lavanda" y responde sobre ese producto sin corregir al usuario bruscamente.
2. **VARIANTES:** Si preguntan por un producto, LISTA TODAS las presentaciones disponibles con sus precios.
   - Ejemplo:
     "Tenemos estas presentaciones de Lavanda:
     - Gotero 10ml: $20.000 (Disponible)
     - Gotero 30ml: $45.000 (Agotado)"
3. **IMÁGENES:** Si piden foto, busca el \`ID: ...\` del producto más relevante y usa la etiqueta: [SEND_IMAGE: ID_EXACTO]. Di: "Aquí tienes una imagen:".
4. Usa SOLAMENTE la información del <contexto>.

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
        return { text: "Lo siento, tuve un error interno procesando tu consulta. Por favor intenta más tarde." };
    }
}
