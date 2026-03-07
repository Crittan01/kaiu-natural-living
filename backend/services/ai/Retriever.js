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
    // Basic text search. Prisma doesn't have native Full Text Search on Postgres enabled by default easily without creating vectors, 
    // so we will split the query and do a permissive OR search using contains.
    const terms = query.split(' ').filter(w => w.length > 3);
    const searchConditions = terms.map(t => ({
        OR: [
            { name: { contains: t, mode: 'insensitive' } },
            { category: { contains: t, mode: 'insensitive' } },
            { variantName: { contains: t, mode: 'insensitive' } }
        ]
    }));

    // If query is too short or terms didn't meet length requirement, default to direct match
    const filter = searchConditions.length > 0 
        ? { OR: searchConditions } 
        : { name: { contains: query, mode: 'insensitive' } };

    const products = await prisma.product.findMany({
        where: filter,
        select: { id: true, name: true, variantName: true, price: true, stock: true, isActive: true, category: true, description: true }
    });
    
    // Filter out inactive products 
    const activeProducts = products.filter(p => p.isActive);

    if (activeProducts.length === 0) {
        return JSON.stringify({ error: "INVENTARIO_VACIO_O_PRODUCTO_NO_EXISTE", instruction_for_ai: "Dile al cliente textualmente que KAIU no vende ni maneja ese producto actualmente." });
    }
    
    // Safety Net: Limit to 10 products so the AI window doesn't overflow and hallucinate
    return JSON.stringify(activeProducts.slice(0, 10));
}

async function executeSearchKnowledgeBase(query) {
    console.log(`🧠 (OOM Protection) Executing Tool: searchKnowledgeBase for query: "${query}"`);
    return JSON.stringify({ 
        info: "Políticas y RAG desactivado temporalmente por limites de Memoria RAM en servidor Cloud gratuito original. Dile al cliente que te repita la pregunta directa o solicite agendamiento humano si la duda es sobre politicas de envios. No trates de inventar politicas.",
        original_query: query 
    });
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
