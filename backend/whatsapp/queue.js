import { Queue, Worker } from 'bullmq';
import { generateSupportResponse } from '../services/ai/Retriever.js';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { redactPII } from '../utils/pii-filter.js';

const prisma = new PrismaClient();

let io; // Internal reference to Socket.IO

export const setIO = (ioInstance) => {
    io = ioInstance;
    console.log("🔌 Socket.IO instance injected into Queue Worker");
};

// CONNECTION CONFIG
const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
};

export const whatsappQueue = new Queue('whatsapp-ai', { connection });

// WORKER LOGIC
console.log("🚀 Initializing WhatsApp AI Worker...");

export const worker = new Worker('whatsapp-ai', async job => {
    const { wamid, from, text } = job.data;
    console.log(`⚙️ Processing Job: ${job.id} - ${text}`);

    try {
        // 1. Check Session & Bot Status
        let session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber: from } });
        
        if (!session) {
            session = await prisma.whatsAppSession.create({
                data: { 
                    phoneNumber: from, 
                    isBotActive: true, 
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    sessionContext: { history: [] } 
                }
            });
            // Emit New Session
            if (io) io.emit('session_new', { id: session.id, phone: from, time: session.updatedAt });
        }

        if (!session.isBotActive) {
            console.log(`⏸️ Bot inactive for ${from}. Skipping.`);
            return;
        }

        // 2. Retrieve History
        let history = (session.sessionContext && session.sessionContext.history) 
                      ? session.sessionContext.history 
                      : [];

        // 3. Append User Message
        // Redact PII before storing in history (Context Window Privacy)
        const cleanText = redactPII(text);
        
        const userMsg = { role: 'user', content: cleanText };
        history.push(userMsg);
        
        // Emit User Message to Dashboard (Real-time)
        if (io) io.to(`session_${session.id}`).emit('new_message', { 
            sessionId: session.id, 
            message: { role: 'user', content: text, time: "Just now" } 
        });
        
        // Keep only last 10 messages
        if (history.length > 10) history = history.slice(-10);

        // --- HANDOVER CHECK ---
        const HANDOVER_KEYWORDS = /\b(humano|agente|asesor|persona|queja|reclamo|ayuda|contactar|hablar con alguien)\b/i;
        if (HANDOVER_KEYWORDS.test(text)) {
            console.log(`🚨 Handover triggered for ${from} by text: "${text}"`);
            
            // 1. Disable Bot
            await prisma.whatsAppSession.update({
                where: { id: session.id },
                data: { 
                    isBotActive: false,
                    handoverTrigger: "KEYWORD_DETECTED",
                    sessionContext: { ...session.sessionContext, history } // Save history including trigger msg
                }
            });

            // Emit Status Update
            if (io) io.emit('session_update', { id: session.id, status: 'handover' });

            // 2. Send "Connect to Agent" Message
            await axios.post(
                `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: "Te estoy transfiriendo con un asesor humano. Un momento por favor." }
                },
                { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
            );
            
            console.log(`✅ Handover executed for ${from}`);
            return; // STOP AI PROCESSING
        }

        // 4. AI Processing (RAG)
        const aiResponse = await generateSupportResponse(text, history);
        
        // 5. Append Bot Message
        const aiMsg = { role: 'assistant', content: aiResponse.text };
        history.push(aiMsg);

        // Emit AI Message to Dashboard
        if (io) io.to(`session_${session.id}`).emit('new_message', { 
            sessionId: session.id, 
            message: { role: 'assistant', content: aiResponse.text, time: "Just now" } 
        });

        // 6. Save Updated History
        await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: { 
                sessionContext: { ...session.sessionContext, history } 
            }
        });
        
        // 7. Send Response via Meta API
        await axios.post(
            `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: from,
                text: { body: aiResponse.text }
            },
            { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
        );
        
        console.log(`✅ Job Completed: ${job.id}`);
    } catch (error) {
        console.error(`❌ Job Failed: ${error.message}`);
        throw error;
    }

}, { 
    connection,
    limiter: {
        max: 10, // Max 10 processing jobs at a time
        duration: 1000
    },
    settings: {
        backoffStrategy: 'exponential' // or custom 
    }
});

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} has failed with ${err.message}`);
});
