
import fetch from 'node-fetch';
import { sendOrderConfirmation, sendPaymentRejectedEmail } from '../services/email.js';

/**
 * Endpoint para consultar el estado real de una transacción en Wompi
 * GET /api/wompi/check-transaction/:id
 */
export default async function checkTransactionHandler(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' });
    }

    try {
        // Detect environment from Public Key
        const pubKey = process.env.VITE_WOMPI_PUB_KEY || '';
        const isSandbox = pubKey.startsWith('pub_test_');
        
        const baseUrl = isSandbox 
            ? 'https://sandbox.wompi.co/v1' 
            : 'https://production.wompi.co/v1';

        console.log(`Wompi Check: pubKeyPrefix=${pubKey.substring(0,8)}... isSandbox=${isSandbox} URL=${baseUrl} ID=${id}`);

        const wompiUrl = `${baseUrl}/transactions/${id}`;
        
        const wompiRes = await fetch(wompiUrl);
        const wompiData = await wompiRes.json();

        if (wompiData.error) {
            console.error("Error consultando Wompi:", wompiData.error);
            return res.status(404).json({ error: 'Transacción no encontrada en Wompi' });
        }

        const transaction = wompiData.data;
        console.log(`Estado Wompi para ${id}: ${transaction.status}`);

        // --- LAZY SYNC: Update Venndelo Status + KAIU DB ---
        // Since Webhooks might fail (especially on localhost without tunnel),
        // we update statuses here if we have a definitive Wompi status.
        if (['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(transaction.status)) {
            try {
                const pinStr = transaction.reference.split('-')[1]; // KAIU-24 -> 24
                const pin = parseInt(pinStr, 10);
                const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

                // Import prisma and InventoryService dynamically to avoid circular deps
                const { prisma } = await import('../db.js');
                const InventoryService = (await import('../services/inventory/InventoryService.js')).default;

                // Find KAIU Order by PIN (readableId) or fallback to externalId
                let dbOrder = null;
                if (!isNaN(pin)) {
                    dbOrder = await prisma.order.findFirst({
                        where: { readableId: pin },
                        include: { items: true }
                    });
                }
                if (!dbOrder) {
                    dbOrder = await prisma.order.findFirst({
                        where: { externalId: pinStr },
                        include: { items: true }
                    });
                }

                if (!dbOrder) {
                    console.warn(`Order not found in DB for reference ${transaction.reference}`);
                } else {
                    const venndeloId = dbOrder.externalId; // Use REAL Venndelo ID
                    
                    let shouldSendEmail = false;
                    let venndeloUrl = '';
                    let venndeloBody = {};

                    if (transaction.status === 'APPROVED') {
                        // Confirm Order
                        console.log(`Syncing Venndelo Status for ${venndeloId} to CONFIRMED...`);
                        venndeloUrl = `https://api.venndelo.com/v1/admin/orders/${venndeloId}/modify-order-confirmation-status`;
                        venndeloBody = { confirmation_status: 'CONFIRMED' };
                        shouldSendEmail = true;
                        
                        await prisma.order.update({
                            where: { id: dbOrder.id },
                            data: { status: 'CONFIRMED' }
                        });
                        
                        // Confirm inventory sale
                        await InventoryService.confirmSale(dbOrder.items);
                        console.log(`✅ KAIU DB Updated: CONFIRMED + PAID`);
                        
                    } else {
                        // Cancel Order (DECLINED/VOIDED/ERROR)
                        console.log(`Syncing Venndelo Status for ${venndeloId} to CANCELLED...`);
                        venndeloUrl = `https://api.venndelo.com/v1/admin/orders/${venndeloId}/cancel`;
                        venndeloBody = {};
                        
                        await prisma.order.update({
                            where: { id: dbOrder.id },
                            data: { status: 'CANCELLED' }
                        });
                        
                        // Release reserved inventory
                        await InventoryService.releaseReserve(dbOrder.items);
                        console.log(`❌ KAIU DB Updated: CANCELLED + Stock Released`);
                    }
                    
                    // Call Venndelo API
                    if (venndeloId && VENNDELO_API_KEY) {
                        const vRes = await fetch(venndeloUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-Venndelo-Api-Key': VENNDELO_API_KEY
                            },
                            body: JSON.stringify(venndeloBody)
                        });
                        
                        let vData;
                        try { vData = await vRes.json(); } catch (e) { vData = await vRes.text(); }
                        
                        if (vRes.status === 422 && JSON.stringify(vData).includes("ya fue procesado")) {
                            console.log(`Venndelo Sync: Order ${venndeloId} already up-to-date.`);
                        } else if (!vRes.ok) {
                            console.warn(`Venndelo Sync Warning (${vRes.status}):`, vData);
                        } else {
                            console.log(`Venndelo Sync Success:`, vData);
                        }
                    }
                    
                    // --- SEND EMAIL ---
                    if (shouldSendEmail) {
                        await sendOrderConfirmation(dbOrder, transaction);
                    } else if (['DECLINED', 'ERROR'].includes(transaction.status)) {
                        await sendPaymentRejectedEmail(dbOrder, transaction);
                    }
                }
            } catch (syncErr) {
                console.error("Error syncing status:", syncErr.message);
            }
        }
        // ----------------------------------------

        res.status(200).json({
            id: transaction.id,
            status: transaction.status, // APPROVED, DECLINED, ERROR, VOIDED
            reference: transaction.reference,
            amount_in_cents: transaction.amount_in_cents,
            timestamp: transaction.created_at
        });

    } catch (error) {
        console.error("Error interno verificando transacción:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}
