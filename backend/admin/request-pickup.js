import { verifyAdminToken } from './auth-helper.js';
import { prisma } from '../db.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const { orderIds } = req.body; 
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'Se requiere una lista de IDs de orden' });
    }

    // Resolve External IDs (Venndelo IDs) from DB
    // Import prisma if not already imported (Need to check file top) - Assuming I will add import at top in a separate chunk or include it here if possible. 
    // Actually, I'll rewrite the whole file content in 2 chunks or just the body.
    
    // Chunk 1: Add import
    // Chunk 2: Add logic
    
    // Let's do Logic first relative to line 30
    try {
        // Resolve IDs
        const dbOrders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { externalId: true }
        });
        
        const venndeloIds = dbOrders.map(o => o.externalId).filter(Boolean);

        if (venndeloIds.length === 0) {
            return res.status(404).json({ error: 'No se encontraron IDs externos para las órdenes seleccionadas' });
        }

        const response = await fetch(`https://api.venndelo.com/v1/admin/shipping/request-pickup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            },
            body: JSON.stringify({ order_ids: venndeloIds })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error Venndelo Pickup:", data);
            return res.status(response.status).json({ error: 'Error solicitando recogida', details: data });
        }

        // AUTO-UPDATE LOCAL STATUS TO SHIPPED
        await prisma.order.updateMany({
            where: { 
                externalId: { in: venndeloIds } 
            },
            data: { 
                status: 'PICKUP_REQUESTED', 
                updatedAt: new Date() 
            }
        });

        return res.status(200).json(data);

    } catch (error) {
        console.error("Error Admin Pickup:", error);
        return res.status(500).json({ error: 'Error Interno' });
    }
}
