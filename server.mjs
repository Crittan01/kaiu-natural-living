import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import createOrderHandler from './backend/create-order.js';
import quoteShippingHandler from './backend/quote-shipping.js';
import getProductsHandler from './backend/get-products.js';
import trackOrderHandler from './backend/track-order.js';
import wompiSignatureHandler from './backend/wompi/sign.js';
import wompiWebhookHandler from './backend/wompi/webhook.js';
import adminLoginHandler from './backend/admin/login.js';
import adminOrdersHandler from './backend/admin/orders.js';
import adminGenerateLabelHandler from './backend/admin/generate-label.js';
import adminConfirmOrderHandler from './backend/admin/confirm-order.js';
import adminRequestPickupHandler from './backend/admin/request-pickup.js';
import checkTransactionHandler from './backend/wompi/check-transaction.js';
import dashboardStatsHandler from './backend/admin/dashboard-stats.js';
import adminInventoryHandler from './backend/admin/inventory.js';
import mockChatWebhook from './backend/whatsapp/webhook-mock.js';
import whatsappWebhook from './backend/whatsapp/webhook.js';

// Configuración inicial
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
const result = dotenv.config({ path: envPath });

console.log(`Intentando cargar ENV desde: ${envPath}`);
if (result.error) {
    console.warn("No se pudo cargar .env.local:", result.error.message);
} else {
    // Verificación de carga exitosa
    console.log(`.env.local cargado. Tienda Origen: ${process.env.VENNDELO_PICKUP_NAME || 'NO_DEFINIDO'}`);
}
const app = express();
const PORT = 3001; // Puerto dedicado para API (distinto a Vite 5173)

// Middlewares Globales
app.use(cors());
app.use(express.json());

// Helper para adaptar Vercel/Next Functions (req, res) a Express tradicional
// Esto permite que los handlers en /api/ funcionen igual en local y en Vercel
const adaptParams = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error("API Error General:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error Interno del Servidor' });
        }
    }
};

// Rutas de la API
app.post('/api/create-order', adaptParams(createOrderHandler));
app.post('/api/quote-shipping', adaptParams(quoteShippingHandler));
app.get('/api/products', adaptParams(getProductsHandler));
app.get('/api/track-order', adaptParams(trackOrderHandler));
app.post('/api/wompi/sign', adaptParams(wompiSignatureHandler));
app.post('/api/wompi/webhook', adaptParams(wompiWebhookHandler));
app.get('/api/wompi/check-transaction/:id', adaptParams(checkTransactionHandler));

// Admin Routes (Protected inside handlers)
app.post('/api/admin/login', adaptParams(adminLoginHandler));
app.get('/api/admin/orders', adaptParams(adminOrdersHandler));
app.post('/api/admin/generate-label', adaptParams(adminGenerateLabelHandler));
app.post('/api/admin/sync-shipments', adaptParams(await import('./backend/admin/sync-shipments.js').then(m => m.default)));
app.post('/api/admin/request-pickup', adaptParams(adminRequestPickupHandler));
app.use('/api/admin/inventory', adaptParams(adminInventoryHandler));
// Dashboard Stats Route
app.use('/api/admin/dashboard-stats', adaptParams(dashboardStatsHandler));

// AI Mock Chat Route (PoC)
app.use('/api', mockChatWebhook);

import { generateSupportResponse } from './backend/services/ai/Retriever.js';

// ... (imports remain)

// Real WhatsApp Webhook (Meta)
app.use('/api/whatsapp', whatsappWebhook);

// Web Chat Endpoint (Omnichannel)
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: "Message required" });

        // Call Shared AI Brain
        const aiResponse = await generateSupportResponse(message, history || []);
        
        let responseText = aiResponse.text;
        let productCard = null;

        // Parse [SEND_IMAGE: UUID] tag
        const imageMatch = responseText.match(/\[SEND_IMAGE:\s*([a-zA-Z0-9-]+)\]/);
        if (imageMatch) {
            const imageId = imageMatch[1];
            // Find product details in sources
            const productSource = aiResponse.sources.find(s => s.id === imageId);
            
            if (productSource) {
                console.log(`📸 Found Product for Card: ${productSource.title} (${imageId})`);
                productCard = {
                    title: productSource.title,
                    image: productSource.image,
                    link: `/catalogo?q=${encodeURIComponent(productSource.title)}`, // Simple link for now
                    price: productSource.price
                };
            } else {
                console.warn(`⚠️ AI requested image ${imageId} but it wasn't in sources.`);
            }
            
            // Remove the tag from the user-facing text
            // responseText = responseText.replace(imageMatch[0], '').trim(); 
            // Better to keep it cleaned on frontend or here? 
            // The frontend ChatWidget regex replaces explicit UUIDs, but let's be clean here.
            // Actually ChatWidget expects the tag to be hidden via CSS or stripped. 
            // Let's rely on ChatWidget stripping if it handles it, or strip it here.
            // Checking ChatWidget code... it creates a "Link Card" if msg.product exists.
        }

        // Return standard JSON
        res.json({
            text: responseText,
            sources: aiResponse.sources,
            product: productCard
        });
    } catch (error) {
        console.error("Web Chat Error:", error);
        res.status(500).json({ error: "Internal AI Error" });
    }
});

// Iniciar Servidor
// Iniciar Servidor
// Iniciar Servidor (Solo en local o si se ejecuta directamente)
if (process.env.NODE_ENV !== 'production' || process.argv[1] === fileURLToPath(import.meta.url)) {
    const server = app.listen(PORT, () => {
        console.log(`Servidor API Local corriendo en http://localhost:${PORT}`);
        console.log(`El frontend debe apuntar a este puerto para /api/`);
    });

    // Graceful Shutdown
    const shutdown = () => {
        console.log('Cerrando servidor API...');
        server.close(() => {
            console.log('Servidor API cerrado.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export default app;


