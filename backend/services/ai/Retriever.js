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

export async function generateSupportResponse(userQuestion, chatHistory = []) {
    try {
        console.log(`🤖 Processing question: "${userQuestion}"`);

        // 1. Contextualize Question (History-Aware)
        let searchQuery = userQuestion;
        if (chatHistory.length > 0) {
            const lastMsg = chatHistory[chatHistory.length - 1]; // Previous message (User or Sara)
            // If the previous message was from Sara listing products, and user asks "Prices", it might help to include Sara's context too?
            // Safer: Just include the last *User* message if it was recent.
            // Actually, let's just append the last message content regardless of role, it gives context.
            // "Tienes lavanda?" -> "Si..." -> "Precios".
            // Query: "Si... Precios". Maybe not great.
            // Query: "Tienes lavanda? Precios". BETTER.
            const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
            if (lastUserMsg && lastUserMsg.content !== userQuestion) {
                searchQuery = `${lastUserMsg.content} ${userQuestion}`;
            }
        }
        console.log(`🔍 Search Query (Contextualized): "${searchQuery}"`);

        // 2. Generate Embedding for Question
        const pipe = await getEmbeddingPipe();
        const output = await pipe(searchQuery, { pooling: 'mean', normalize: true });
        const questionVector = Array.from(output.data);

        // 2. Vector Search in DB (Find top 3 relevant chunks)
        // Note: vector <-> vector distance (cosine similarity usually)
        // pgvector operator for cosine distance is <=>
        const results = await prisma.$queryRaw`
            SELECT id, content, metadata, 1 - (embedding <=> ${questionVector}::vector) as similarity
            FROM knowledge_base
            ORDER BY embedding <=> ${questionVector}::vector
            LIMIT 15;
        `;

        // 3. Construct Context Blob
        const contextText = results.map(r => r.content).join("\n---\n");
        
        // Format History for Prompt
        const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Sara'}: ${m.content}`).join("\n");

        // 4. Call Claude
        const systemPrompt = `
Eres Sara, una asesora experta en aceites esenciales y bienestar de KAIU.
Tu objetivo es ayudar al cliente a elegir el mejor producto.

REGLAS DE ORO (Si las rompes, fallas):
1. **CERO EMOJIS.** Tu estilo es minimalista y serio.
2. **NUNCA DIGAS QUE ERES UNA IA.**
3. **IMÁGENES:** Si piden foto, DEBES buscar el ID y poner la etiqueta.
   - Respuesta Aceptable: "Claro, mira esta foto:" [SEND_IMAGE: ID]
4. **LISTAS COMPLETAS:** Si piden productos (ej: Lavanda), LISTA TODAS LAS OPCIONES (Goteros 10ml, 30ml, Roll-ons, etc) que veas en el contexto. No omitas ninguna.
5. **NO MUESTRES IDs:** Nunca pongas el UUID en el texto.
6. **CONCISIÓN:** Sé breve. Máximo 4 líneas de conversación + la lista de productos. Ve al grano.

REGLAS DE SEGURIDAD:
1. **CATÁLOGO ESTRICTO:** Solo vendemos lo que aparece en el contexto con la etiqueta [PRODUCTO].
   - Si recomiendas algo que no vendemos, di claramente: "No lo tenemos en catálogo actualmente".
2. **SALUD:** Si mencionan enfermedades graves, deriva al médico.
3. **ESCALAMIENTO:** Link humano: https://wa.me/573150718723

INSTRUCCIONES DE RESPUESTA:
1. **ERRORES DE USUARIO:** Si escriben mal (ej: "Lavanta"), es Lavanda.
2. **VARIANTES:** Muestra TODAS las presentaciones así:
   - Nombre (Tamaño): $Precio (Stock)
3. **IMÁGENES:** Usa la etiqueta [SEND_IMAGE: ID_EXACTO] al final.
4. **MEMORIA:** Usa el historial.

<historial_chat>
${historyText}
</historial_chat>

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
