import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import createOrderHandler from './api/create-order.js';
import quoteShippingHandler from './api/quote-shipping.js';
import getProductsHandler from './api/get-products.js';
import trackOrderHandler from './api/track-order.js';
import wompiSignatureHandler from './api/wompi-signature.js';

// Configuración inicial
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '.env.local');
const result = dotenv.config({ path: envPath });

console.log(`Intentando cargar ENV desde: ${envPath}`);
if (result.error) {
    console.warn("⚠️ No se pudo cargar .env.local:", result.error.message);
} else {
    // Verificación de carga exitosa
    console.log(`✅ .env.local cargado. Tienda Origen: ${process.env.VENNDELO_PICKUP_NAME || 'NO_DEFINIDO'}`);
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
app.post('/api/wompi-signature', adaptParams(wompiSignatureHandler));

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor API Local corriendo en http://localhost:${PORT}`);
    console.log(`ℹ️  El frontend debe apuntar a este puerto para /api/`);
});
