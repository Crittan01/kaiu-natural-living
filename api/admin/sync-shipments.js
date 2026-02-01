
import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';
import LogisticsManager from '../services/logistics/LogisticsManager.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        console.log("🔄 Iniciando sincronización de envíos...");

        // 1. Buscar órdenes activas (No finalizadas) que tengan ID externo
        const activeOrders = await prisma.order.findMany({
            where: {
                externalId: { not: null },
                status: {
                    in: ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PICKUP_REQUESTED', 'SHIPPED']
                }
            },
            take: 50, // Límite por lote para evitar timeouts
            orderBy: { updatedAt: 'asc' }, // Priorizar las que no se han actualizado recientemente
            select: { 
                id: true, 
                externalId: true, 
                status: true, 
                carrier: true, 
                readableId: true, 
                trackingNumber: true,
                paymentMethod: true // Needed for COD check
            }
        });

        console.log(`Found ${activeOrders.length} orders to check.`);

        let updatedCount = 0;
        const updates = [];

        // 2. Consultar Logística para cada una
        for (const order of activeOrders) {
            try {
                const statusInfo = await LogisticsManager.getShipmentStatus(order.carrier, order.externalId);
                
                if (statusInfo && statusInfo.status) {
                    const newStatus = statusInfo.status;
                    
                    // Si el estado es diferente, actualizar
                    if (newStatus !== order.status) {
                        console.log(`📝 Order ${order.readableId}: ${order.status} -> ${newStatus}`);
                        
                        const updateData = {
                            status: newStatus,
                            trackingNumber: statusInfo.trackingNumber || order.trackingNumber
                        };

                        await prisma.order.update({
                            where: { id: order.id },
                            data: updateData
                        });
                        
                        updatedCount++;
                        updates.push({ 
                            id: order.readableId, 
                            old: order.status, 
                            new: newStatus 
                        });
                    }
                }
            } catch (err) {
                console.error(`Error syncing order ${order.readableId}:`, err.message);
            }
        }

        return res.status(200).json({ 
            success: true, 
            processed: activeOrders.length, 
            updated: updatedCount,
            details: updates 
        });

    } catch (error) {
        console.error("Error Sync Shipments:", error);
        return res.status(500).json({ error: 'Internal Server Error during synchronization' });
    }
}
