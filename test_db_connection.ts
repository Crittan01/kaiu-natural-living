import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    // Log queries to see if it's even trying
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  console.log("🔌 Testing DB Connection...");
  console.log("DB URL from Process:", process.env.DATABASE_URL ? "Defined (Hidden)" : "UNDEFINED");
  
  try {
      const start = Date.now();
      await prisma.$connect();
      console.log(`✅ Connected in ${Date.now() - start}ms`);
      
      const count = await prisma.product.count();
      console.log(`📊 Product Count: ${count}`);
      
  } catch (err) {
      console.error("❌ Connection Failed:", err);
  } finally {
      await prisma.$disconnect();
  }
}

main();
