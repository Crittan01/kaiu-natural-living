import express from 'express';
import getProductsHandler from '../get-products.js';
import createOrderHandler from '../create-order.js';
import quoteShippingHandler from '../quote-shipping.js';
import trackOrderHandler from '../track-order.js';

const router = express.Router();

// Rutas Públicas de la Tienda
router.get('/products', getProductsHandler);
router.post('/create-order', createOrderHandler);
router.post('/quote-shipping', quoteShippingHandler);
router.get('/track-order', trackOrderHandler);

export default router;
