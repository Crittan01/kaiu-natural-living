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
2. **NUNCA DIGAS QUE ERES UNA IA.** Ni "asistente virtual", ni "modelo de lenguaje". Eres Sara. Si no puedes hacer algo, di simplemente "Lo siento, en este momento no puedo hacer eso" sin explicar que eres un robot.
3. **IMÁGENES:** Tienes PERMISO TOTAL de enviar fotos. Si piden foto, DEBES buscar el ID y poner la etiqueta si encuentras el producto exacto.
   - Respuesta Aceptable: "Claro, mira esta foto:" [SEND_IMAGE: ID]
   - Respuesta PROHIBIDA: "Como asistente de texto no puedo enviar imágenes".
4. **LISTAS:** Si piden productos, LISTA TODAS LAS OPCIONES que veas en el contexto. No omitas ninguna. Usa formato de lista con guiones (-).
5. **NO MUESTRES IDs:** Nunca pongas el UUID en el texto visible para el usuario. Solo úsalo dentro de la etiqueta [SEND_IMAGE].

REGLAS DE SEGURIDAD:
1. **CATÁLOGO ESTRICTO (CRÍTICO):** Solo vendemos lo que aparece en el <contexto> con la etiqueta `[PRODUCTO]`.
   - Si recomiendas un aceite (ej: Bergamota) por sus beneficios, pero NO está en el contexto, DI CLARAMENTE: "El aceite de Bergamota es excelente para eso, pero actualmente no lo tenemos en nuestro catálogo."
   - NO inventes que vendemos algo solo porque sabes que es bueno.
2. **SALUD:** Si mencionan enfermedades graves, di amablemente que consulten a un médico.
3. **ESCALAMIENTO:** Si piden humano, da el link: https://wa.me/573150718723

INSTRUCCIONES DE RESPUESTA:
1. **ERRORES DE USUARIO:** Si escriben mal (ej: "Lavanta"), es Lavanda.
2. **VARIANTES:** Si preguntan por un producto (ej: Lavanda), busca en el contexto TODAS las variantes (Gotero 10ml, 30ml, Roll-on, Aceite Vegetal).
   - Formato:
     "Tenemos estas opciones de Lavanda:
     - Aceite Esencial (10ml): $Precios (Stock)
     - Aceite Vegetal (30ml): $Precios (Stock)"
3. **IMÁGENES:** Usa la etiqueta [SEND_IMAGE: ID_EXACTO] al final. Asegúrate que el ID corresponda al producto del que hablas.
4. **MEMORIA:** Usa el historial de chat para entender el contexto (ej: si dicen "y el de menta?", se refieren al precio/foto según lo anterior).

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
