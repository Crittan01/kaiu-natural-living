import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Creando sesión de prueba en la base de datos...");
    
    // Check if it exists
    let session = await prisma.whatsAppSession.findUnique({
        where: { phoneNumber: "573001234567" }
    });

    if (!session) {
        session = await prisma.whatsAppSession.create({
            data: {
                phoneNumber: "573001234567",
                isBotActive: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                sessionContext: {
                    history: [
                        { role: 'user', content: 'Hola, tienen promociones?' },
                        { role: 'model', content: '¡Hola! Sí, actualmente en KAIU Natural Living tenemos...' }
                    ]
                }
            }
        });
        console.log("✅ Sesión creada:", session.id);
    } else {
        console.log("ℹ️ La sesión de prueba ya existe.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
