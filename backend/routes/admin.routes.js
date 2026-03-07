import express from 'express';
import adminLoginHandler from '../admin/login.js';
import adminOrdersHandler from '../admin/orders.js';
import adminGenerateLabelHandler from '../admin/generate-label.js';
import adminConfirmOrderHandler from '../admin/confirm-order.js';
import adminRequestPickupHandler from '../admin/request-pickup.js';
import dashboardStatsHandler from '../admin/dashboard-stats.js';
import adminInventoryHandler from '../admin/inventory.js';
import adminKnowledgeHandler from '../admin/knowledge.js';
import syncShipmentsHandler from '../admin/sync-shipments.js';

const router = express.Router();

// Rutas Privadas del Panel Admin (El JWT se valida generalmente de lado de los handlers individuales en el esquema actual)
router.post('/login', adminLoginHandler);
router.get('/orders', adminOrdersHandler);
router.post('/generate-label', adminGenerateLabelHandler);
router.post('/confirm-order', adminConfirmOrderHandler);
router.post('/request-pickup', adminRequestPickupHandler);
router.get('/dashboard-stats', dashboardStatsHandler);

// Inventario
router.get('/inventory', adminInventoryHandler);
router.post('/inventory', adminInventoryHandler);
router.put('/inventory', adminInventoryHandler);

// RAG / Knowledge Base
router.all('/knowledge', adminKnowledgeHandler);

// Sincronización Webhooks Externos (Transportadoras)
router.post('/sync-shipments', syncShipmentsHandler);

export default router;
