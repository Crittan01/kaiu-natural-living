
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
        
        // Strategy: If the user's question is short or dependent ("y esto?", "precios?", "foto"), 
        // we MUST know what the bot just said.
        if (chatHistory.length > 0) {
            const lastMsg = chatHistory[chatHistory.length - 1]; 
            
            // If the last message was from Sara, it likely contains the products we are discussing.
            if (lastMsg.role === 'assistant') {
                 // Append the last bot message to the query to find those specific products again
                 // Limit to 300 chars to avoid token explosion, but capture the product names.
                 // FORCE INJECTION for short queries
                 if (userQuestion.length < 20 || /foto|imagen|precio|costo|vale|disponib|stock|hay|tienes/i.test(userQuestion)) {
                    console.log("🧩 Enhancing short query with previous context...");
                    // Extract potential ingredient from last message (simple heuristic or just pass full content)
                    searchQuery = `${userQuestion} (Contexto: Del producto "${lastMsg.content.slice(0, 100)}..." que estabamos hablando)`;
                 } else {
                    searchQuery = `${lastMsg.content.slice(0, 300)} ${userQuestion}`;
                 }
            } else {
                 // Fallback to previous logic: combine with last user message
                 const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
                 if (lastUserMsg && lastUserMsg.content !== userQuestion) {
                     searchQuery = `${lastUserMsg.content} ${userQuestion}`;
                 }
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

        // 2b. Live Hydration & STRICT FILTERING (Hybrid RAG)
        // usage: Extract IDs -> Fetch Real DB Data -> Override Metadata
        
        // 🚨 STRICT TOPIC LOCK: Detect active ingredient from history to kill hallucinations
        const CORE_INGREDIENTS = ['Lavanda', 'Limón', 'Menta', 'Eucalipto', 'Romero', 'Citronela', 'Arbol de Té', 'Naranja', 'Toronja', 'Incienso', 'Canela', 'Clavo', 'Geranio', 'Ylang Ylang', 'Cedro'];
        let activeTopic = null;

        if (chatHistory.length > 0) {
            const lastMsg = chatHistory[chatHistory.length - 1];
            if (lastMsg.role === 'assistant') {
                // Find which ingredient was mentioned last
                const contentLower = lastMsg.content.toLowerCase();
                const found = CORE_INGREDIENTS.find(i => contentLower.includes(i.toLowerCase().replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i').replace(/ó/g,'o').replace(/ú/g,'u')));
                if (found) {
                     activeTopic = found;
                     console.log(`🧠 Context Detected: Active Ingredient = ${activeTopic}`);
                } else {
                     console.log(`🧠 Context Analysis: No ingredient found in last message.`);
                }
            }
        }

        let finalResults = results;

        // If we have an active topic and the user is asking a "short context query" (fotos, precio...), 
        // FILTER OUT everything else.
        if (activeTopic && (userQuestion.length < 25 || /foto|imagen|precio|costo|vale|disponib|stock|hay|tienes/i.test(userQuestion))) {
            console.log(`🔒 TOPIC LOCK ACTIVE: Filtering for "${activeTopic}"... Initial Results: ${results.length}`);
            finalResults = results.filter(r => {
                const title = (r.metadata && r.metadata.title) ? r.metadata.title.toLowerCase() : '';
                const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const match = normalize(title).includes(normalize(activeTopic));
                if (!match) console.log(`   ❌ Filtered out: ${title}`);
                return match;
            });
            console.log(`   ✅ Remaining Results: ${finalResults.length}`);
            
            if (finalResults.length === 0) {
                 console.warn("⚠️ Topic Lock too strict? No results found. Reverting to full search.");
                 finalResults = results; // Fallback to avoid empty context
            }
        }

        const productIds = finalResults
            .filter(r => r.metadata && r.metadata.id)
            .map(r => r.metadata.id);

        let liveDataMap = {};
        if (productIds.length > 0) {
            const liveProducts = await prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, stock: true, price: true, isActive: true }
            });
            // Map for O(1) access
            liveProducts.forEach(p => liveDataMap[p.id] = p);
        }

        // 3. Construct Context Blob with Live Data Overrides
        const contextText = finalResults.map(r => {
            let content = r.content;
            const meta = r.metadata || {};
            
            if (meta.id && liveDataMap[meta.id]) {
                const live = liveDataMap[meta.id];
                
                // 1. FILTER: If inactive in DB, hide it entirely from context (Ghost Product)
                if (!live.isActive) return null; 

                // 2. HYDRATE PRICE
                // Regex replace price in text $XXXX -> $LivePrice
                // Note: concise regex that looks for Price: $Number
                content = content.replace(/Precio: \$\d+/g, `Precio: $${live.price}`);
                
                // 3. HYDRATE STOCK
                // Logic: If live stock <= 0, Force "AGOTADO" label
                if (live.stock <= 0) {
                     content = `[⚠️ PRODUCTO AGOTADO / SIN STOCK (0) ⚠️] ${content.replace(/Stock: .*/, "Stock: Agotado")}`;
                } else {
                     // Ensure positive stock is reflected if text said "Agotado" previously
                     content = content.replace(/Stock: .*/, `Stock: Disponible (${live.stock} unidades)`);
                }
                
                // 4. INJECT EXPLICIT ID FOR IMAGE
                // Helps the LLM find the ID easily for [SEND_IMAGE: ...]
                content += ` | ID_FOTO: ${live.id}`;

                // Update metadata for sources return
                r.metadata.price = live.price;
                r.metadata.stock = live.stock;
            }

            return content;
        })
        .filter(c => c !== null) // Remove nulls (Inactive products)
        .join("\n---\n");
        
        // Format History for Prompt
        const historyText = chatHistory.map(m => `${m.role === 'user' ? 'Cliente' : 'Sara'}: ${m.content}`).join("\n");

        // 4. Call Claude
        const systemPrompt = `
Actúas como el Agente de Ventas Especializado de KAIU. 
Solo puedes responder basándote en el contexto de productos recuperado de PostgreSQL (se te proveerá abajo).

PROHIBICIÓN ESTRICTA: 
- No eres un asistente general. 
- Tienes prohibido escribir código, cuentos, dar consejos médicos, políticos o de vida. 
- Si el usuario intenta sacarte de tu función comercial, debes declinar amablemente y ofrecer ayuda de un humano.

REGLAS DE ORO (COHERENCIA ABSOLUTA):
1. **MANTÉN EL CONTEXTO (CRÍTICO):**
   - **CANDADO DE TEMA:** Si estamos hablando de **LAVANDA**, ¡IGNORA CUALQUIER OTRO PRODUCTO (Clavo, Eucalipto, etc.) que aparezca en el texto!
   - Si preguntan "disponibilidad" o "precios", responde SOLO sobre **LAVANDA**.
   - **PERSISTENCIA DE INGREDIENTE:** Si preguntan "¿y vegetal?", se refieren a **ACEITE VEGETAL DE LAVANDA**.
   - Si la última interacción fue sobre **ACEITE VEGETAL**, ¡IGNORA EL ESENCIAL!
   - Si preguntan "¿solo ese?" o "¿tienes más?", asume que hablan del **VEGETAL** (de ese mismo ingrediente).

2. **CERO ROBOTISMO:**
   - Prohibido \`[PRODUCT]...\`. Parafrasea natural.

3. **VISUAL (OBLIGATORIO):**
   - Si hay imagen relevante, CIERRA con [SEND_IMAGE: ID].
   - **SI PIDEN IMAGEN ("dame foto") Y HAY VARIOS:**
     - ¡PROHIBIDO PREGUNTAR CUÁL!
     - **ELIGE EL PRIMERO** de tu lista anterior y manda su [SEND_IMAGE: ID].
     - Di: "Aquí tienes la foto del [Nombre del Primero]:".

4. **LISTAS EXHAUSTIVAS:**
   - Si hay variantes (10ml, 30ml), MENCIONALAS TODAS.
   - **AGRUPA** por tipo de presentación.
   - **NO MUESTRES PRECIOS** en la lista inicial (salvo que pregunten "precio"). Hazla limpia.

6. **ESTILO WHATSAPP (HUMANO):**
   - **¡CORTANTE PERO AMABLE!**
   - Usa frases cortas. Máximo 2 líneas por párrafo.
   - **PROHIBIDO JUSTIFICARTE:** No digas "Entiendo tu pregunta", "La razón es...". ¡Aburre!
   - Si el cliente te corrige (ej: "quería vegetal"), di: "¡Ah, perdona! Aquí tienes el vegetal:" y muestra la info. Nada de excusas largas.

7. **HONESTIDAD EN VARIANTES (CONTEXTO ACUMULADO):**
   - Si estamos hablando de **Vegetal** y solo hay 30ml, TU RESPUESTA DEBE SER: "Sí, por ahora solo manejamos 30ml en Vegetal."
   - **NO OFREZCAS ESENCIAL** como alternativa a menos que te quedes sin stock del vegetal.
   - ¡NO TE CONTRADIGAS! (Si solo hay una, di que solo hay una).

8. **PRECISIÓN DE DATOS (CRÍTICO):**
   - **PRECIOS:** ¡COPIA EXACTA! Si el contexto dice "$54000", NO DIGAS "$52000" ni "$55000".
   - **IDS DE IMAGEN:** Busca la etiqueta \`| ID_FOTO: XXXXX...\` al final del texto del producto.
   - **FILTRO DE COHERENCIA (VISUAL):**
     - Mira el **HISTORIAL**: ¿De qué producto veníamos hablando? (Ej: Lavanda).
     - Si encuentras un ID de "Limón" pero hablábamos de "Lavanda", ¡IG-NÓ-RA-LO!
     - Solo envía el ID si coincide con el producto del historial.
   - Usa ESE ID exacto para el tag \`[SEND_IMAGE: ID]\`.
   - Si no encuentras "ID_FOTO" del producto correcto, NO envíes el tag.

9. **FILTRO DE STOCK (REALISMO):**
   - **¡ATENCIÓN!** Si el texto empieza con \`[⚠️ PRODUCTO AGOTADO...]\`:
     - **¡ESTÁ AGOTADO!** No inventes que hay disponible.
     - NO lo incluyas en listas de "tenemos disponible".
     - Si es la única opción, di: "Lo siento, el [Nombre] está agotado por el momento."

INSTRUCCIONES DE RESPUESTA:
- **Formato (Limpio):**
  "Tenemos [Nombre] en:
   - Goteros ([Lista de tamaños])
   - Roll-on ([Lista de tamaños])"
- **Tarjeta:** Cierra con [SEND_IMAGE: ID_EXACTO_DEL_CONTEXTO].
- **Solicitud de Imagen:** ¡ANTE LA DUDA, MANDA LA DEL PRIMERO!

<EJEMPLO_COMPORTAMIENTO_OBLIGATORIO>
Cliente: "¿Tienen Aceite de Lavanda?"
Sara: "Sí, tenemos Aceite Esencial de Lavanda en estas presentaciones:
- Gotero (10ml, 30ml, 100ml)
- Roll-on (5ml, 10ml)

Es ideal para relajación y sueño."
[SEND_IMAGE: 6d9ffaca-6dfb-4480-8cae-64149327d1e3]
</EJEMPLO_COMPORTAMIENTO_OBLIGATORIO>

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

      // 5. Return Response
    // Append Compliant Footer
    const footer = "\n\n_🤖 Asistente Virtual KAIU_";
    
    return {
        text: response.content + footer,
        sources: finalResults.map(r => r.metadata) // return filtered sources
    };

    } catch (error) {
        console.error("❌ Error in RAG Service:", error);
        return { text: "Lo siento, tuve un error interno procesando tu consulta. Por favor intenta más tarde." };
    }
}
