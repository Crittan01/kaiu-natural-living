import { PrismaClient } from '@prisma/client';
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, ToolMessage, AIMessage } from "@langchain/core/messages";

const prisma = new PrismaClient();

// Singleton for Embedding Pipeline (Lazy Load)
let embeddingPipe = null;

// Bypass SSL for local dev
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function getEmbeddingPipe() {
    if (!embeddingPipe) {
        console.log("🔌 Loading Embedding Model (BYPASSED FOR RENDER FREE TIER OOM PROTECTION)...");
        // We bypass the actual transformer load to save 300MB of RAM
        embeddingPipe = () => { return { toList: () => new Array(1536).fill(0.0) } };
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
            temperature: 0.1, // Even lower temp for tool calling reliability
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    return chatModel;
}

// ---------------------------------------------------------
// REFACTORED: NATIVE TOOLS
// ---------------------------------------------------------

const tools = [
    {
        name: "searchInventory",
        description: "Busca en el inventario actual (catálogo de productos) de KAIU para responder preguntas sobre precios, disponibilidad, y variantes. ÚSALA SIEMPRE que el cliente pregunte por un producto específico, precios o si 'tienen' algo.",
        input_schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "El nombre del producto, ingrediente o variante a buscar (Ej: 'Lavanda', 'Gotero 10ml', 'Árbol de Té'). Omitir saludos. Omitir conectores.",
                }
            },
            required: ["query"],
        },
    },
    {
        name: "searchKnowledgeBase",
        description: "Busca en el 'Cerebro RAG' manuales de la empresa, tiempos de envío, costos de envío a ciudades, y políticas generales de la marca.",
        input_schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "La pregunta o concepto a buscar en la base de políticas (Ej: 'Tiempos de envío Bogotá', 'Manejan contra entrega').",
                }
            },
            required: ["query"],
        },
    }
];

async function executeSearchInventory(query) {
    console.log(`🛠️ Executing Tool: searchInventory with query: "${query}"`);
    
    // Normalizar query. NUNCA eliminar adjetivos clave como "vegetales" o "esenciales". 
    // Solo quitamos conectores inservibles.
    const stopWords = ['de', 'la', 'el', 'los', 'las', 'un', 'una', 'para', 'con', 'sin', 'que', 'tienes', 'hay', 'busco', 'necesito'];
    const terms = query.toLowerCase().split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
    
    let filter = {};
    if (terms.length > 0) {
        // AND RIGUROSO: Si el usuario busca "Aceite Vegetal Coco", el producto devuelto SÍ O SÍ debe hacer match con los tres
        filter = {
            AND: terms.map(t => ({
                OR: [
                    { name: { contains: t, mode: 'insensitive' } },
                    { category: { contains: t, mode: 'insensitive' } },
                    { variantName: { contains: t, mode: 'insensitive' } },
                    { description: { contains: t, mode: 'insensitive' } } 
                ]
            }))
        };
    } else {
        filter = { name: { contains: query, mode: 'insensitive' } };
    }

    try {
        const products = await prisma.product.findMany({
            where: filter,
            select: { id: true, name: true, variantName: true, price: true, stock: true, isActive: true, category: true, description: true }
        });
        
        const activeProducts = products.filter(p => p.isActive);

        if (activeProducts.length === 0) {
            // INYECCIÓN LETAL contra la alucinación
            return JSON.stringify({ 
                error: "DATO_CRITICO: INVENTARIO_VACIO", 
                instruction_for_ai: `ORDEN ESTRICTA DEL SISTEMA: KAIU NATURAL LIVING **NO** TIENE NI VENDE NADA RELACIONADO A "${query}". ESTÁ PROHIBIDO SUGERIR O INVENTAR SUSTITUTOS. DEBES DILE AL CLIENTE LITERAMENTE: "Lo siento, actualmente no manejamos ${query} en nuestro catálogo." Y NADA MÁS.` 
            });
        }
        
        return JSON.stringify(activeProducts.slice(0, 5));
    } catch (e) {
        console.error("Inventory DB Search Error", e);
        return JSON.stringify({ error: "DB_ERROR", instruction_for_ai: "Ocurrió un error buscando el inventario." });
    }
}

async function executeSearchKnowledgeBase(query) {
    console.log(`🧠 Executing Tool: searchKnowledgeBase for query: "${query}"`);
    try {
        const { OpenAIEmbeddings } = await import('@langchain/openai');
        const embeddings = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "text-embedding-3-small",
            dimensions: 384 // Force 384 dimensions to match the existing Postgres column
        });

        // 1. Vectorize User Question
        const queryVector = await embeddings.embedQuery(query);
        const vectorString = `[${queryVector.join(',')}]`;

        // 2. Perform Cosine Similarity Search (<=>)
        // Adjust limit (e.g. 2 chunks) to avoid flooding Claude's window
        const matches = await prisma.$queryRaw`
            SELECT id, content, metadata, 1 - (embedding <=> ${vectorString}::vector) as similarity
            FROM "knowledge_base"
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT 2;
        `;

        if (!matches || matches.length === 0 || matches[0].similarity < 0.25) {
            return JSON.stringify({ error: "POLITICA_NO_ENCONTRADA_O_DATO_IRRELEVANTE", instruction_for_ai: "El manual no tiene respuesta a esto. Pide disculpas y ofrece contactar con un humano 👨🏻‍💻." });
        }

        return JSON.stringify(matches.map(m => ({
            source: m.metadata?.title || 'Documento Interno',
            relevance: Math.round(m.similarity * 100) + '%',
            content: m.content
        })));
        
    } catch (e) {
        console.error("RAG Error:", e);
        return JSON.stringify({ error: "INTERNAL_RAG_ERROR", detail: "Falla temporal extrayendo el manual." });
    }
}

// ---------------------------------------------------------
// ORCHESTRATOR
// ---------------------------------------------------------

export async function generateSupportResponse(userQuestion, chatHistory = []) {
    try {
        console.log(`🤖 Processing question via Agent: "${userQuestion}"`);

        // Truncate history to last 4 messages to prevent tool hallucinations 
        // Force the model to query the database again instead of relying on long-term context
        const recentHistory = chatHistory.slice(-4);
        const chatLog = recentHistory.map(m => {
            const cleanContent = m.content.replace(/\n\n_🤖 Asistente Virtual KAIU_$/g, '');
            return m.role === 'user' ? new HumanMessage(cleanContent) : new AIMessage(cleanContent);
        });

        const systemPrompt = `
Eres KAIU, el experto amigable en botánica de "KAIU Natural Living". 

REGLAS DE ORO (ESTRICTAMENTE PROHIBIDO VIOLARLAS):
1. NUNCA ADIVINES NI INVENTES UN PRODUCTO O PRECIO. Tu memoria interna de conocimientos del mundo exterior DEBE SER IGNORADA. Si respondes a un cliente ofreciendo algo que no tenemos, la empresa pierde dinero.
2. SIEMPRE, sin excepción, usa la herramienta "searchInventory" cuando el usuario mencione ingredientes, necesite algo, o pregunte "¿tienen X?". 
3. SI LA HERRAMIENTA "searchInventory" te devuelve ERROR O CERO RESULTADOS, DEBES decirle al cliente explícitamente: "Lo siento, actualmente no manejamos productos con ese ingrediente en nuestro catálogo oficial." NUNCA INVENTES UNA ALTERNATIVA QUE NO PROVENGA DE LA HERRAMIENTA.
4. Mostrar precios siempre en pesos colombianos formato: $45.000 COP.
5. Usa tono cálido, emojis sutiles (🌿✨).
6. Si preguntan por imágenes o ver un producto, usa [SEND_IMAGE: UUID_REAL_DEVUELTO_POR_HERRAMIENTA_AQUI]. Nunca te inventes el UUID.
7. REGLA ANTI-AMALGAMA: Si el usuario busca "Aceite Vegetal de Coco" y el JSON devuelto SÓLO tiene "Aceite Vegetal de Ricino" y "Aceite Vegetal de Lavanda", NO PUEDES RESPONDER diciendo que tienes Coco. Responde: "Lo siento, actualmente tenemos Aceites Vegetales, pero el ingrediente COCO/ALMENDRAS no lo manejamos." No fusiones nombres de la herramienta con la petición del cliente.
`;

        // --- ANTI-HALLUCINATION HOOK ---
        // Force the model to query the database again if asked for photos, because it forgets UUIDs
        let finalUserQuestion = userQuestion;
        if (/(foto|imagen|imágen|ver|mostrar)/i.test(finalUserQuestion)) {
            finalUserQuestion += "\n[SISTEMA: Obligatorio ejecutar searchInventory ahora mismo para obtener los IDs reales (UUID) de las imágenes. NO inventes IDs aleatorios.]";
        }

        const messages = [
            new SystemMessage(systemPrompt),
            ...chatLog,
            new HumanMessage(finalUserQuestion)
        ];

        const modelWithTools = getChatModel().bindTools(tools);

        // 1. Initial invocation (let it decide if it needs a tool)
        let aiMessage = await modelWithTools.invoke(messages);
        
        // 2. Process Tools (Agent Loop)
        // If the model decides to call one or more tools, we process them
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            messages.push(aiMessage); // Append the "intent to call tool" message
            
            for (const toolCall of aiMessage.tool_calls) {
                let toolResultStr = "";
                if (toolCall.name === "searchInventory") {
                    toolResultStr = await executeSearchInventory(toolCall.args.query);
                } else if (toolCall.name === "searchKnowledgeBase") {
                    toolResultStr = await executeSearchKnowledgeBase(toolCall.args.query);
                } else {
                    toolResultStr = JSON.stringify({ error: "Unknown tool" });
                }
                
                // Append Tool Message 
                messages.push(new ToolMessage({
                    tool_call_id: toolCall.id,
                    content: toolResultStr,
                    name: toolCall.name
                }));
            }
            
            // 3. Second invocation (now with tool results included)
            console.log("🧠 Tools resolved, generating final answer...");
            aiMessage = await modelWithTools.invoke(messages);
        }

        // Return compliance footer
        const footer = "\n\n_🤖 Asistente Virtual KAIU_";
        
        return {
            text: aiMessage.content + footer,
            sources: [] // We drop sources for now as Anthropic absorbs them
        };

    } catch (error) {
        console.error("❌ Error in Agent Service:", error);
        return { text: "Lo siento, tuve un error interno procesando tu consulta. Por favor intenta más tarde." };
    }
}
