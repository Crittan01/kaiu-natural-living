import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminToken } from '../admin/auth-helper.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Multer Configuration for Memory Buffer (Supabase)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Auth Middleware: Provide secure protection intentionally per-route
const requireAdmin = (req, res, next) => {
    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// POST /upload - Single Image Upload to Supabase Storage
router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!supabase) {
            throw new Error("Supabase Client is not initialized. Check your ENV variables.");
        }
        
        const ext = path.extname(req.file.originalname) || '';
        const uniqueFilename = `${uuidv4()}${ext}`;
        
        // Upload to Supabase 'products' bucket
        const { data, error } = await supabase.storage
            .from('products')
            .upload(uniqueFilename, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });
            
        if (error) throw error;
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
            .from('products')
            .getPublicUrl(uniqueFilename);
            
        res.json({ url: publicUrlData.publicUrl });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to upload file to Supabase" });
    }
});

// GET /sessions - List active sessions
router.get('/sessions', requireAdmin, async (req, res) => {
    try {
        // Fetch sessions updated in the last 7 days
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

        // Format for Dashboard
        const formatted = sessions.map(s => ({
            id: s.id,
            name: s.user?.name || s.phoneNumber, // Fallback to phone if name null
            phone: s.phoneNumber,
            lastMsg: s.sessionContext?.history?.slice(-1)[0]?.content || "Iniciando conversación...",
            time: s.updatedAt,
            status: s.handoverTrigger ? 'handover' : (s.isBotActive ? 'bot' : 'human'),
            unread: 0 // TODO: Implement unread count logic
        }));

        res.json(formatted);
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
});

// GET /sessions/:id/messages - Get history
router.get('/sessions/:id/messages', requireAdmin, async (req, res) => {
    try {
        const session = await prisma.whatsAppSession.findUnique({
            where: { id: req.params.id }
        });

        if (!session) return res.status(404).json({ error: "Session not found" });

        // History is stored in sessionContext.history
        // We might want to persist strict messages table later, but for now this works as per Phase 2
        const history = session.sessionContext?.history || [];
        
        // Map to format expected by ChatView
        // History format in DB: { role: 'user'|'assistant', content: '...' }
        const formatted = history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role, // Handle Gemini 'model' role if present
            content: msg.content,
            time: "Recently" // We don't have per-message timestamps in the JSON blob yet, mostly
        }));

        res.json({ 
            messages: formatted,
            isBotActive: session.isBotActive
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// PATCH /sessions/:id/toggle - Toggle AI
router.patch('/sessions/:id/toggle', requireAdmin, async (req, res) => {
    try {
        const { isBotActive } = req.body;
        const session = await prisma.whatsAppSession.update({
            where: { id: req.params.id },
            data: { 
                isBotActive: Boolean(isBotActive),
                handoverTrigger: isBotActive ? null : "MANUAL_OVERRIDE" // Clear trigger if re-enabling bot
            }
        });
        
        // Emit Socket Event (Pseudo-code here, actual emit happens in controller or we pass io instance)
        // req.app.get('io').to('dashboard').emit('session_update', { id: session.id, status: ... });

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: "Failed to update session" });
    }
});

// POST /messages/send - Send Manual Message
router.post('/messages/send', requireAdmin, async (req, res) => {
    try {
        const { sessionId, content } = req.body;
        const session = await prisma.whatsAppSession.findUnique({ where: { id: sessionId } });
        if (!session) return res.status(404).json({ error: "Session not found" });

        // 1. Send to WhatsApp Cloud API
        await axios.post(
            `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: session.phoneNumber,
                text: { body: content }
            },
            { headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
        );

        // 2. Append to History
        const history = session.sessionContext?.history || [];
        history.push({ role: 'assistant', content }); // Manual message counts as assistant/agent
        
        await prisma.whatsAppSession.update({
            where: { id: sessionId },
            data: { sessionContext: { ...session.sessionContext, history } }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Send Error:", error?.response?.data || error.message);
        res.status(500).json({ error: "Failed to send message" });
    }
});

export default router;
