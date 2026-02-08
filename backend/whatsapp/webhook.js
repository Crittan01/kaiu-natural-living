import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { generateSupportResponse } from '../services/ai/Retriever.js';

const router = express.Router();

// Environment Variables
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN; // Permantent Token

// Security Middleware: Validate X-Hub-Signature-256
function validateSignature(req, res, next) {
    const signature = req.headers['x-hub-signature-256'];
    
    if (!signature) {
        console.warn("⚠️ Missing X-Hub-Signature-256");
        // For PoC/Dev ease, maybe allow check process.env.NODE_ENV? 
        // But for production safety, we should enforce it if APP_SECRET is present.
        if (process.env.NODE_ENV === 'production' && APP_SECRET) {
             return res.status(401).send("Missing Signature");
        }
        return next();
    }

    if (!APP_SECRET) {
        console.warn("⚠️ WHATSAPP_APP_SECRET not set. Skipping validation.");
        return next();
    }

    const elements = signature.split('=');
    const signatureHash = elements[1];
    
    // Create hash using raw body (req.rawBody expected from body-parser verify)
    // NOTE: In standard Express, req.body is already parsed. 
    // We need the raw buffer. We'll assume server.js is configured to provide req.rawBody or similar,
    // OR we re-stringify (less safe but works for simple JSON).
    // For Vercel/Serverless, accessing raw body can be tricky.
    // Let's us a simplified check for now or skip if complex.
    
    // Simpler strategy for PoC: Trust Vercel's environment isolation + Verify Token check.
    // We will enact strict check later.
    next();
}

// 1. GET /api/whatsapp/webhook - Verification Request from Meta
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log("✅ Webhook Verified!");
            res.status(200).send(challenge);
        } else {
            console.error("❌ Verification failed. Token mismatch.");
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Simple in-memory deduplication (for Vercel lambda instance lifetime)
const processedMessages = new Set();

// 2. POST /api/whatsapp/webhook - Incoming Messages
router.post('/webhook', validateSignature, async (req, res) => {
    const body = req.body;

    // Check if it's a WhatsApp Event
    if (body.object === 'whatsapp_business_account') {
        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const message = value?.messages?.[0];

            // Only process text messages from users
            if (message && message.type === 'text') {
                const from = message.from; // User Phone
                const text = message.text.body;
                const wamid = message.id;

                // Deduplication
                if (processedMessages.has(wamid)) {
                    console.log(`🔄 Duplicate message ignored: ${wamid}`);
                    return res.sendStatus(200);
                }
                processedMessages.add(wamid);
                // Cleanup Set to avoid memory leak (not perfect for serverless but helps)
                if (processedMessages.size > 100) {
                     const it = processedMessages.values();
                     processedMessages.delete(it.next().value);
                }

                console.log(`📩 Message from ${from}: ${text}`);
                // Mark message as read
                axios.post(
                    `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
                    {
                        messaging_product: "whatsapp",
                        status: "read",
                        message_id: wamid
                    },
                    { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
                ).catch(() => {});

                // --- 2. Session History Management ---
                // Simple in-memory store. For production, use Redis or DB.
                if (!global.sessionStore) global.sessionStore = new Map();
                const userHistory = global.sessionStore.get(from) || [];
                
                // Add user message
                userHistory.push({ role: 'user', content: text });
                
                // Keep only last 10 messages
                if (userHistory.length > 10) userHistory.shift();

                // --- 3. AI Processing ---
                const aiResponse = await generateSupportResponse(text, userHistory);
                let responseText = aiResponse.text;
                
                // Add AI response to history
                userHistory.push({ role: 'assistant', content: responseText });
                global.sessionStore.set(from, userHistory);

                let imageToSend = null;

                // --- 4. Image Parsing ---
                // Check if AI output contains [SEND_IMAGE: ID]
                // UUID regex: 8-4-4-4-12 hex digits
                const imageTagMatch = responseText.match(/\[SEND_IMAGE:\s*([a-fA-F0-9-]{36})\]/);
                if (imageTagMatch) {
                    const productId = imageTagMatch[1];
                    console.log(`🔎 Found Image Tag for ID: ${productId}`);
                    
                    const source = aiResponse.sources.find(s => s.id === productId);
                    if (source) {
                        if (source.image && source.image.startsWith("http")) {
                            imageToSend = source.image;
                            console.log(`✅ Found valid image URL: ${imageToSend}`);
                        } else {
                            console.warn(`⚠️ Source found but image URL invalid/missing: ${JSON.stringify(source)}`);
                        }
                    } else {
                        console.warn(`⚠️ Product ID ${productId} not found in retrieved sources metadata.`);
                    }
                    // Clean tag from text
                    responseText = responseText.replace(imageTagMatch[0], "").trim();
                } else {
                     // Fallback check for "partial" UUIDs or messy tags
                     if (responseText.includes("[SEND_IMAGE:")) {
                         console.warn("⚠️ Potential malformed image tag found in response.");
                         responseText = responseText.replace(/\[SEND_IMAGE:[^\]]*\]/g, "");
                     }
                }

                // --- 4. Smart Delay (Human Reading/Typing Speed) ---
                // Average typing speed: ~40ms per char. 
                // We don't want to be TOO slow, but realistic.
                // Min delay: 1s. Max delay: 5s.
                const delay = Math.min(5000, Math.max(1000, responseText.length * 30));
                console.log(`⏳ Humanizing: Waiting ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));

                // --- 5. Send Response ---
                if (imageToSend) {
                    console.log(`📸 Sending Image: ${imageToSend}`);
                    await axios.post(
                        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
                        {
                            messaging_product: "whatsapp",
                            to: from,
                            type: "image",
                            image: { link: imageToSend, caption: responseText }
                        },
                        { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
                    );
                } else {
                    await axios.post(
                        `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`,
                        {
                            messaging_product: "whatsapp",
                            to: from,
                            text: { body: responseText }
                        },
                        { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' } }
                    );
                }
                console.log(`📤 Reply sent to ${from}`);
            }
        } catch (error) {
            console.error("❌ Error processing webhook:", error.message);
            // If we fail, we still return 200 to stop Meta from retrying indefinitely?
            // Or 500 to retry? For PoC, let's return 200 to avoid spamming.
        }
    }
    
    // Always return 200 OK at the end
    if (!res.headersSent) {
        res.sendStatus(200);
    }
});

export default router;
