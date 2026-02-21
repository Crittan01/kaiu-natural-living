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
import adminKnowledgeHandler from './backend/admin/knowledge.js';
import syncShipmentsHandler from './backend/admin/sync-shipments.js';
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
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './backend/api/routes.js';
import { setIO } from './backend/whatsapp/queue.js'; // Import setIO

// ... (previous imports)

const app = express();
const httpServer = createServer(app); // Wrap Express
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow Vite dev server and production
        methods: ["GET", "POST", "PATCH"]
    }
});

// Share IO instance with Routes and Queue
app.set('io', io);
setIO(io); // Inject IO into Queue Worker

const PORT = 3001; 

// Middlewares Globales
app.use(cors());
app.use(express.json());

// API Routes (Dashboard)
app.use('/api', apiRoutes);

// Legacy/Frontend Product Route
app.get('/api/products', getProductsHandler);

// Public API Routes (Checkout & Tracking)
app.post('/api/create-order', createOrderHandler);
app.post('/api/quote-shipping', quoteShippingHandler);
app.get('/api/track-order', trackOrderHandler);

// Wompi Integration
app.post('/api/wompi/sign', wompiSignatureHandler);
app.post('/api/wompi/webhook', wompiWebhookHandler);
app.get('/api/wompi/check-transaction/:id', checkTransactionHandler);

// Admin API Routes
app.post('/api/admin/login', adminLoginHandler);
app.get('/api/admin/orders', adminOrdersHandler);
app.post('/api/admin/generate-label', adminGenerateLabelHandler);
app.post('/api/admin/confirm-order', adminConfirmOrderHandler);
app.post('/api/admin/request-pickup', adminRequestPickupHandler);
app.get('/api/admin/dashboard-stats', dashboardStatsHandler);
app.get('/api/admin/inventory', adminInventoryHandler);
app.put('/api/admin/inventory', adminInventoryHandler); // Support PUT for updates
app.all('/api/admin/knowledge', adminKnowledgeHandler); // Support GET, POST, DELETE
app.post('/api/admin/sync-shipments', syncShipmentsHandler);

// WhatsApp Webhook (Mock & Real)
app.post('/webhook/whatsapp', whatsappWebhook);
app.get('/webhook/whatsapp', whatsappWebhook); // Verification GET

// Socket.IO Events
io.on('connection', (socket) => {
    console.log('🔌 Dashboard Client Connected:', socket.id);

    socket.on('join_session', (sessionId) => {
        socket.join(`session_${sessionId}`);
        console.log(`Socket ${socket.id} joined session_${sessionId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Dashboard Client Disconnected');
    });
});

// ... (existing adaptParams and routes)

// Iniciar Servidor (Usar httpServer instead of app.listen)
if (process.env.NODE_ENV !== 'production' || process.argv[1] === fileURLToPath(import.meta.url)) {
    httpServer.listen(PORT, () => {
        console.log(`🚀 Servidor API + Socket.IO corriendo en http://localhost:${PORT}`);
        console.log(`📡 WebSocket listo para conexión.`);
    });
// ...

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


