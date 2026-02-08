import { PrismaClient } from '@prisma/client';
import { pipeline } from '@xenova/transformers';

const prisma = new PrismaClient();

// Bypass SSL check for HuggingFace download (Development Only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// FAQ Data (Hardcoded for PoC)
const faqs = [
    {
        question: "¿Qué son los aceites esenciales?",
        answer: "Los aceites esenciales son compuestos aromáticos naturales extraídos de las plantas. En Kaiu, ofrecemos aceites 100% puros y terapéudos."
    },
    {
        question: "¿Cómo comprar?",
        answer: "Puedes comprar directamente en nuestra web agregando productos al carrito. Aceptamos pagos con Wompi (Tarjetas/PSE) y pago contra entrega."
    },
    {
        question: "¿Hacen envíos a todo el país?",
        answer: "Sí, realizamos envíos a toda Colombia a través de transportadoras aliadas como Coordinadora, Envía e Interrapidísimo. El tiempo de entrega es de 2 a 5 días hábiles."
    },
    {
        question: "¿Tienen tienda física?",
        answer: "Somos una tienda 100% online, lo que nos permite ofrecerte los mejores precios y llegar a cualquier rincón del país."
    }
];

async function generateEmbedding(text, pipe) {
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

async function main() {
    console.log("🚀 Iniciando ingestión de conocimiento...");

    // 1. Initialize Embedding Model (Local)
    // 'Xenova/all-MiniLM-L6-v2' is a small, fast model good for semantic search.
    console.log("Loading embedding model...");
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    // 2. Clear existing Knowledge Base
    await prisma.knowledgeBase.deleteMany({});
    console.log("🧹 Base de conocimiento limpiada.");

    // 3. Ingest Products
    const products = await prisma.product.findMany({ where: { isActive: true }});
    console.log(`📦 Procesando ${products.length} productos...`);

    const sanitizeText = (text) => {
        if (!text) return '';
        return text
            .replace(/cura/gi, "apoyo para")
            .replace(/tratamiento/gi, "cuidado")
            .replace(/medicamento/gi, "producto natural")
            .replace(/insomnio/gi, "sueño reparador")
            .replace(/ansiedad/gi, "relajación")
            .replace(/dolor/gi, "malestar");
    };

    const convertDriveLink = (url) => {
        if (!url) return '';
        // Check if it's a google drive file view link
        const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/);
        if (driveMatch) {
            const fileId = driveMatch[1];
            // Convert to direct download/view link that WhatsApp might render
            // Warning: WhatsApp strictly requires specific headers. 'uc?export=view' is best effort.
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
        return url;
    };

    const disclaimer = " (Nota: Este producto es cosmético y de bienestar, no sustituye tratamiento médico).";

    for (const p of products) {
        const cleanBenefits = sanitizeText(p.benefits || 'No especificados');
        const cleanDescription = sanitizeText(p.description || '');
        const stockStatus = p.stock > 0 ? `Disponible (${p.stock} unidades)` : 'Agotado';
        const rawImage = p.images && p.images.length > 0 ? p.images[0] : '';
        const image = convertDriveLink(rawImage);
        const variant = p.variantName ? `Variante: ${p.variantName}` : '';
        
        const text = `[PRODUCTO] ID: ${p.id} | SKU: ${p.sku} | Nombre: ${p.name} | ${variant} | Categoría: ${p.category || 'General'} | Precio: $${p.price} | Stock: ${stockStatus} | Beneficios: ${cleanBenefits} | Descripción: ${cleanDescription}${disclaimer}`;
        const vector = await generateEmbedding(text, pipe);

        // Store vector using raw SQL
        await prisma.$executeRaw`
            INSERT INTO knowledge_base (id, content, metadata, embedding, "createdAt")
            VALUES (gen_random_uuid(), ${text}, ${JSON.stringify({ source: 'product', id: p.id, sku: p.sku, title: p.name, variant: p.variantName, category: p.category, image: image, stock: p.stock })}::jsonb, ${vector}::vector, NOW());
        `;
    }

    // 4. Ingest FAQs
    console.log(`❓ Procesando ${faqs.length} preguntas frecuentes...`);
    for (const faq of faqs) {
        const text = `[PREGUNTA FRECUENTE] Pregunta: ${faq.question} | Respuesta: ${faq.answer}`;
        const vector = await generateEmbedding(text, pipe);

        await prisma.$executeRaw`
            INSERT INTO knowledge_base (id, content, metadata, embedding, "createdAt")
            VALUES (gen_random_uuid(), ${text}, ${JSON.stringify({ source: 'faq', title: faq.question })}::jsonb, ${vector}::vector, NOW());
        `;
    }

    console.log("✅ Ingestión completada exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
