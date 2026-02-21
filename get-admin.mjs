import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(admin);
}
run().finally(() => prisma.$disconnect());
