import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function get() {
   const session = await prisma.whatsAppSession.findUnique({where: {phoneNumber: '573125835649'}});
   console.log(session ? JSON.stringify(session.sessionContext.history, null, 2) : "NO SESSION");
}
get().finally(() => prisma.$disconnect());
