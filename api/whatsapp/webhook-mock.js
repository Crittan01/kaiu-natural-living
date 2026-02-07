import express from 'express';
import { generateSupportResponse } from '../services/ai/Retriever.js';

const router = express.Router();

// Mock Endpoint to test AI Response (Simulates WhatsApp User Message)
// POST /api/mock-chat
// Body: { "message": "Hola, tienen aceite de lavanda?" }
router.post('/mock-chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log("📨 Mock Webhook received:", message);
        const start = Date.now();

        const aiResponse = await generateSupportResponse(message);

        const duration = Date.now() - start;
        console.log(`⏱️ Response generated in ${duration}ms`);

        res.json({
            user_message: message,
            ai_reply: aiResponse.text,
            sources: aiResponse.sources,
            processing_time_ms: duration
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
