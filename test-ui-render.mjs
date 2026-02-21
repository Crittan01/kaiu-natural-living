import { Queue } from 'bullmq';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: '.env.local' });

const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
};

const whatsappQueue = new Queue('whatsapp-ai', { connection });

async function simulate() {
    const phoneNumber = "573150718723"; // Test number
    const message = "Me podrías volver a describir en qué viene el aceite de lavanda pero sin fotos, solo con texto y que incluya los precios por favor.";
    
    console.log(`🚀 Simulating text-only test message...`);

    await whatsappQueue.add('process-message', {
        wamid: `wamid.SIMULATED.${uuidv4()}`,
        from: phoneNumber,
        text: message,
        timestamp: Math.floor(Date.now() / 1000).toString()
    });

    console.log("\n✅ Job added to queue.");
    process.exit(0);
}

simulate().catch(console.error);
