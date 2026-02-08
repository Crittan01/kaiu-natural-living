import { prisma } from '../db.js';

async function clearDB() {
    try {
        console.log("🧹 Limpiando base de datos...");
        
        // Delete OrderItems first to avoid FK constraints
        const deletedItems = await prisma.orderItem.deleteMany({});
        console.log(`✅ ${deletedItems.count} items eliminados.`);

        // Delete Orders
        const deletedOrders = await prisma.order.deleteMany({});
        console.log(`✅ ${deletedOrders.count} ordenes eliminadas.`);

        console.log("✨ Base de datos limpia y lista para pruebas.");
    } catch (error) {
        console.error("❌ Error limpiando DB:", error);
    } finally {
        await prisma.$disconnect();
    }
}

clearDB();