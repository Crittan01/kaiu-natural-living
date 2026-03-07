import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import getProductsHandler from './backend/get-products.js';
import mockChatWebhook from './backend/whatsapp/webhook-mock.js';
import whatsappWebhook from './backend/whatsapp/webhook.js';

// Configuración inicial de Entorno (Flexible)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Intentar cargar el .env estándar
let dotenvResult = dotenv.config({ path: path.resolve(__dirname, '.env') });

// 2. Si falla o estamos en local, intentar cargar .env.local
if (dotenvResult.error || process.env.NODE_ENV !== 'production') {
    const envLocalPath = path.resolve(__dirname, '.env.local');
    const localResult = dotenv.config({ path: envLocalPath });
    
    if (localResult.error && dotenvResult.error) {
        console.warn("⚠️ No se pudo cargar ni .env ni .env.local. Dependiendo de las variables inyectadas por el sistema.");
    } else if (!localResult.error) {
        console.log(`✅ Archivo .env.local cargado con éxito.`);
    }
} else {
    console.log(`✅ Archivo .env principal cargado con éxito.`);
}

console.log(`Tienda Origen Configuracion: ${process.env.VENNDELO_PICKUP_NAME || 'NO_DEFINIDO'}`);
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
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// API Routes (Dashboard)
app.use('/api', apiRoutes);

import publicRoutes from './backend/routes/public.routes.js';
import adminRoutes from './backend/routes/admin.routes.js';
import wompiRoutes from './backend/routes/wompi.routes.js';

// Legacy/Frontend Product Route (Mantenido global para la vista del index por ahora si quieres)
app.get('/api/products', getProductsHandler);

// Nuevos enrutadores conectados
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wompi', wompiRoutes);

// WhatsApp Webhook (Mock & Real)
app.use('/api/whatsapp', whatsappWebhook);

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
        console.log('🛑 Cerrando servidor API (Graceful Shutdown) ...');
        httpServer.close(() => {
            console.log('✅ Servidor API cerrado de forma segura.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

export default app;


