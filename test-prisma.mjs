import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Testeando query Prisma de /api/sessions...");
    try {
        const sessions = await prisma.whatsAppSession.findMany({
            where: {
                updatedAt: {
                    gte: new Date(new Date().setDate(new Date().getDate() - 7))
                }
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                user: { select: { name: true } }
            }
        });

        const formatted = sessions.map(s => ({
            id: s.id,
            name: s.user?.name || s.phoneNumber,
            phone: s.phoneNumber,
            lastMsg: s.sessionContext?.history?.slice(-1)[0]?.content || "Iniciando...",
            time: s.updatedAt,
            status: s.handoverTrigger ? 'handover' : (s.isBotActive ? 'bot' : 'human'),
            unread: 0
        }));

        console.log("Success! Encontradas:", formatted.length);
        console.log(formatted);
    } catch (e) {
        console.error("❌ Prisma Query Error:", e);
    }
}

main().finally(() => prisma.$disconnect());
