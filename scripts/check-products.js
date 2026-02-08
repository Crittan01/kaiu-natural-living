import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        select: { name: true, stock: true, images: true }
    });
    console.log(JSON.stringify(products, null, 2));
}

check().finally(() => prisma.$disconnect());
