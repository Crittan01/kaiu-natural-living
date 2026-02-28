import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
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
const connection = process.env.REDIS_URL 
    ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : {
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

        // 4. AI Processing (RAG + Tools)
        const aiResponse = await generateSupportResponse(text, history);
        
        // --- IMAGE EXTRACTION ---
        let finalText = aiResponse.text;
        const imageRegex = /\[SEND_IMAGE:\s*([^\]]+)\]/g;
        let match;
        const imageIds = [];
        
        while ((match = imageRegex.exec(finalText)) !== null) {
            imageIds.push(match[1]);
        }
        
        // Remove the tags from the text for history/dashboard
        finalText = finalText.replace(imageRegex, '')
                             .replace(/<[^>]+>/g, '') // Strip all XML tags (e.g., <result>, </result>)
                             .replace(/_🤖 Asistente Virtual KAIU_\s*$/g, '') // Strip footer if it accidentally appended twice
                             .trim();
        // Fetch image URLs from DB first to save in history
        const imageUrls = [];
        for (const pid of imageIds) {
            const product = await prisma.product.findUnique({ where: { id: pid.trim() } });
            if (product && product.images && product.images.length > 0) {
                const rawUrl = product.images[0];
                const cleanUrl = rawUrl.startsWith('http') ? rawUrl : `${process.env.BASE_URL || 'http://localhost:3001'}${rawUrl}`;
                imageUrls.push(cleanUrl);
            }
        }

        // 5. Append Bot Message
        const aiMsg = { role: 'assistant', content: finalText || "(Envía una imagen sin texto)" };
        if (imageUrls.length > 0) aiMsg.images = imageUrls;
        history.push(aiMsg);

        // Emit AI Message to Dashboard
        if (io) io.to(`session_${session.id}`).emit('new_message', { 
            sessionId: session.id, 
            message: { ...aiMsg, time: "Just now" } 
        });

        // 6. Save Updated History
        await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: { 
                sessionContext: { ...session.sessionContext, history } 
            }
        });
        
        // 7. Send Text Response via Meta API
        if (finalText) {
            await axios.post(
                `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: from,
                    text: { body: finalText }
                },
                { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
            );
        }

        // 8. Send Images via Meta Media API
        for (const cleanUrl of imageUrls) {
            await axios.post(
                `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: from,
                    type: "image",
                    image: { link: cleanUrl }
                },
                { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
            );
        }
        
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
