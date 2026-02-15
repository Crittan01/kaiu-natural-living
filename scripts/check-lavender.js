
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { name: { contains: 'Lavanda', mode: 'insensitive' } }
    });
    console.log(JSON.stringify(products, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
