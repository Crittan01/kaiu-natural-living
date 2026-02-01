
import { prisma } from '../db.js';
import InventoryService from '../services/inventory/InventoryService.js';
import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * Manejador del Webhook de Wompi
 * Recibe notificaciones de transacciones (Aprobadas, Declinadas, etc.)
 */
export default async function wompiWebhookHandler(req, res) {
    try {
        console.log("---- WOMPI WEBHOOK RECEIVED ----");
        
        const { data, signature, timestamp } = req.body;

        if (!data || !signature || !timestamp) {
            console.error("Webhook inválido: Datos incompletos");
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const { id, reference, amount_in_cents, currency, status } = data.transaction;
        
        console.log(`Transacción ID: ${id}`);
        console.log(`Referencia: ${reference}`);
        console.log(`Estado: ${status}`);

        // 1. Verificar Integridad
        const secret = process.env.WOMPI_INTEGRITY_SECRET;
        if (!secret) return res.status(500).json({ error: "Configuración incompleta" });

        const integrityString = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
        const generatedSignature = crypto.createHash('sha256').update(integrityString).digest('hex');

        if (generatedSignature !== signature.checksum) {
            console.error("Error Integridad Wompi");
            return res.status(400).json({ error: "Integridad fallida" });
        }

        // 2. Procesar Orden
        const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
        const pinStr = reference.split('-')[1]; // KAIU-12345 -> 12345
        const pin = parseInt(pinStr, 10);

        // Buscar Order en DB Local por PIN (readableId)
        let dbOrder = null;
        if (!isNaN(pin)) {
             dbOrder = await prisma.order.findFirst({
                 where: { readableId: pin },
                 include: { items: true }
             });
        }
        
        // Fallback: Try externalId if PIN fails (backward compatibility)
        if (!dbOrder) {
             dbOrder = await prisma.order.findUnique({
                 where: { externalId: pinStr },
                 include: { items: true }
             });
        }

        if (!dbOrder) console.warn(`Orden DB no encontrada para referencia ${reference} (PIN: ${pin})`);
        
        // For Venndelo Update, we need the EXTERNAL ID (Venndelo's ID), which is stored in dbOrder.externalId
        const venndeloId = dbOrder?.externalId || pinStr; // Best effort

        if (!dbOrder) console.warn(`Orden DB no encontrada para referencia ${reference} (ExtID: ${venndeloId})`);

        // Helper para Venndelo
        const updateVenndeloStatus = async (id, newStatus) => {
             if (!id) return;
             try {
                await fetch(`https://api.venndelo.com/v1/admin/orders/${id}/modify-order-confirmation-status`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Venndelo-Api-Key': VENNDELO_API_KEY },
                    body: JSON.stringify({ confirmation_status: newStatus })
                });
             } catch (e) { console.error("Error Venndelo API:", e.message); }
        };

        if (status === 'APPROVED') {
            console.log("✅ PAGO APROBADO");
            // 1. Venndelo -> CONFIRMED
            await updateVenndeloStatus(venndeloId, 'CONFIRMED');
            
            // 2. DB -> PAYMENT: PAID, STATUS: CONFIRMED
            if (dbOrder) {
                await prisma.order.update({
                    where: { id: dbOrder.id },
                    data: { status: 'CONFIRMED' }
                });
                
                // 3. Inventory -> Confirm Sale (Real Stock Decrease)
                // (Note: create-order reserves stock. ConfirmSale finalizes it).
                await InventoryService.confirmSale(dbOrder.items);
            }

        } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
            console.log(`❌ PAGO FALLIDO (${status})`);
            // 1. Venndelo -> REJECTED
            await updateVenndeloStatus(venndeloId, 'REJECTED');

            // 2. DB -> STATUS: CANCELLED
            if (dbOrder) {
                await prisma.order.update({
                    where: { id: dbOrder.id },
                    data: { status: 'CANCELLED' }
                });

                // 3. Inventory -> Release Stock
                await InventoryService.releaseReserve(dbOrder.items);
            }
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error Webhook:", error);
        return res.status(500).json({ error: "Internal Error" });
    }
}
