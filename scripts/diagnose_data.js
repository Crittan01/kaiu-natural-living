
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("🔍 DIAGNOSTICO DE DATOS: LAVANDA");
    
    // 1. Real Data (Product Table)
    const products = await prisma.product.findMany({
        where: { name: { contains: 'Lavanda', mode: 'insensitive' } }
    });
    
    console.log("\n1️⃣ REAL DATA (DB Product Table):");
    products.forEach(p => {
        console.log(`[${p.id}] ${p.name} | Var: ${p.variantName} | $${p.price} | Stock: ${p.stock}`);
    });

    // 2. RAG Data (KnowledgeBase Table)
    const chunks = await prisma.knowledgeBase.findMany({
        where: { content: { contains: 'Lavanda', mode: 'insensitive' } }
    });

    console.log("\n2️⃣ RAG CONTEXT (DB KnowledgeBase Table):");
    chunks.forEach(c => {
        console.log(`--- Chunk [${c.id}] ---`);
        console.log(c.content.slice(0, 200) + "..."); // Preview
        console.log("Metadata:", JSON.stringify(c.metadata));
    });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
