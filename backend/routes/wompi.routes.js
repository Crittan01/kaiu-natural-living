import express from 'express';
import wompiSignatureHandler from '../wompi/sign.js';
import wompiWebhookHandler from '../wompi/webhook.js';
import checkTransactionHandler from '../wompi/check-transaction.js';

const router = express.Router();

// Wompi Payment Gateway Routes
router.post('/sign', wompiSignatureHandler);
router.post('/webhook', wompiWebhookHandler);
router.get('/check-transaction/:id', checkTransactionHandler);

export default router;
