import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import createOrderHandler from './api/create-order.js';
import quoteShippingHandler from './api/quote-shipping.js';
import getProductsHandler from './api/get-products.js';

// Config
dotenv.config({ path: '.env.local' });
const app = express();
const PORT = 3001; // Corremos en puerto diferente a Vite (5173/3000)

// Middlewares
app.use(cors());
app.use(express.json());

// Helper para adaptar Vercel Functions (req, res) a Express
const adaptParams = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error("API Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Routes
app.post('/api/create-order', adaptParams(createOrderHandler));
app.post('/api/quote-shipping', adaptParams(quoteShippingHandler));
app.get('/api/products', adaptParams(getProductsHandler));

// Start
app.listen(PORT, () => {
    console.log(`✅ Servidor API Local corriendo en http://localhost:${PORT}`);
    console.log(`👉 Configura tu Vite proxy o llama directamente a este puerto.`);
});
