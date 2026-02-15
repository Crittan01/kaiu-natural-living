
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: {
            name: { contains: 'Lavanda', mode: 'insensitive' }
        }
    });

    console.log("Current Lavender Products:");
    products.forEach(p => {
        console.log(`- ${p.name} (${p.variantName || 'No Variant'}): $${p.price}`);
    });

    // Update if needed
    const vegetal = products.find(p => p.name.includes('Vegetal') && p.price !== 54000);
    if (vegetal) {
        console.log(`Updating ${vegetal.name} price to 54000...`);
        await prisma.product.update({
            where: { id: vegetal.id },
            data: { price: 54000 }
        });
        console.log("Updated.");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
