import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage, ToolMessage, AIMessage } from "@langchain/core/messages";

const prisma = new PrismaClient();

// Singleton for Embedding Pipeline (Lazy Load)
let embeddingPipe = null;

// Bypass SSL for local dev
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
        return JSON.stringify({ error: "No se encontraron productos coincidentes en el inventario." });
    }
    
    return JSON.stringify(activeProducts);
}

async function executeSearchKnowledgeBase(query) {
    console.log(`🛠️ Executing Tool: searchKnowledgeBase with query: "${query}"`);
    const pipe = await getEmbeddingPipe();
    const output = await pipe(query, { pooling: 'mean', normalize: true });
    const questionVector = Array.from(output.data);

    const results = await prisma.$queryRaw`
        SELECT id, content, metadata
        FROM knowledge_base
        ORDER BY embedding <=> ${questionVector}::vector
        LIMIT 3;
    `;
    
    if (results.length === 0) {
         return JSON.stringify({ error: "No se encontró información en las políticas de la empresa." });
    }
    
    return JSON.stringify(results.map(r => ({ metadata: r.metadata, content: r.content })));
}

// ---------------------------------------------------------
// ORCHESTRATOR
// ---------------------------------------------------------

export async function generateSupportResponse(userQuestion, chatHistory = []) {
    try {
        console.log(`🤖 Processing question via Agent: "${userQuestion}"`);

        const chatLog = chatHistory.map(m => {
            const cleanContent = m.content.replace(/\n\n_🤖 Asistente Virtual KAIU_$/g, '');
            return m.role === 'user' ? new HumanMessage(cleanContent) : new AIMessage(cleanContent);
        });

        const systemPrompt = `
Actúas como el Agente Especializado de KAIU Natural Living. Eres conciso, amable y directo.

REGLAS DE ORO:
1. TIENES HERRAMIENTAS. Si te preguntan por productos, DEBES usar "searchInventory". Si te preguntan por políticas de envíos/pagos, usas "searchKnowledgeBase".
2. LOS PRECIOS ESTÁN EN PESOS COLOMBIANOS (COP). Responde usando el símbolo "$" y formato amigable (Ej: "$45.000").
3. Si un producto de la herramienta "searchInventory" tiene stock 0, diles que está temporalmente agotado, pero NO les cobres ni ofrezcas alternativas que no existan.
4. IMÁGENES: Para enviar la imagen de un producto, averigua el \`id\` del producto en la herramienta searchInventory y escribe la etiqueta exacta al final de tu mensaje: [SEND_IMAGE: id_aqui]. REGLA ESTRICTA: NUNCA menciones el ID largo o "código de producto" en la conversación con el cliente, utilízalo ÚNICAMENTE dentro de la etiqueta [SEND_IMAGE: id_aqui] al final de tu respuesta (Ejemplo: "... te la envío a continuación. [SEND_IMAGE: a1b2c3d4...]"). Solo un tag por mensaje máximo.
5. Respuestas Genuinas: NO DIGAS "Buscando en mi base de datos...". Simplemente da la respuesta natural. "Sí, manejamos lavanda en presentación de 10ml por $50.000".
        `;

        const messages = [
            new SystemMessage(systemPrompt),
            ...chatLog,
            new HumanMessage(userQuestion)
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
