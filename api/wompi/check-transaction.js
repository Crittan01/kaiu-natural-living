
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

        // --- LAZY SYNC: Update Venndelo Status ---
        // Since Webhooks might fail (especially on localhost without tunnel),
        // we update Venndelo status here if we have a definitive Wompi status.
        if (['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'].includes(transaction.status)) {
            try {
                const venndeloId = transaction.reference.split('-')[1];
                const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

                if (venndeloId && !isNaN(venndeloId) && VENNDELO_API_KEY) {
                    // Logic: APPROVED -> CONFIRMED, 
                    // DECLINED/VOIDED/ERROR -> CANCEL (Global Status)
                    
                    let url = '';
                    let body = {};
                    let shouldSendEmail = false;

                    if (transaction.status === 'APPROVED') {
                        // Confirm Order
                        console.log(`Syncing Venndelo Status for ${venndeloId} to CONFIRMED...`);
                        url = `https://api.venndelo.com/v1/admin/orders/${venndeloId}/modify-order-confirmation-status`;
                        body = { confirmation_status: 'CONFIRMED' };
                        shouldSendEmail = true;
                    } else {
                        // Cancel Order
                        console.log(`Syncing Venndelo Status for ${venndeloId} to CANCELLED (via /cancel)...`);
                        url = `https://api.venndelo.com/v1/admin/orders/${venndeloId}/cancel`;
                        body = {}; // Empty body as per debug success
                    }
                    
                    const vRes = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Venndelo-Api-Key': VENNDELO_API_KEY
                        },
                        body: JSON.stringify(body)
                    });
                    
                    let vData;
                    try {
                        vData = await vRes.json();
                    } catch (e) {
                        vData = await vRes.text();
                    }

                    // Handle Idempotency (422: Order already processed)
                    let syncSuccess = false;
                    if (vRes.status === 422 && JSON.stringify(vData).includes("ya fue procesado")) {
                         console.log(`Venndelo Sync: Order ${venndeloId} was already up-to-date (Idempotent).`);
                         syncSuccess = true;
                    } else if (!vRes.ok) {
                         console.warn(`Venndelo Sync Warning (${vRes.status}):`, vData);
                    } else {
                         console.log(`Venndelo Sync Success (${vRes.status}):`, vData);
                         syncSuccess = true;
                    }

                    // --- SEND EMAIL IF SYNC SUCCESSFUL (OR IDEMPOTENT) ---
                    if (syncSuccess) {
                        try {
                             // Fetch Order Details
                             const orderRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${venndeloId}`, {
                                headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
                             });
                             
                             if (orderRes.ok) {
                                 const orderData = await orderRes.json();
                                 const order = orderData.data || orderData; 
                                 
                                 if (shouldSendEmail) {
                                     // APPROVED -> Order Confirmation
                                     await sendOrderConfirmation(order, transaction);
                                 } else if (transaction.status === 'DECLINED' || transaction.status === 'ERROR') {
                                     // DECLINED/ERROR -> Payment Rejected Email
                                     await sendPaymentRejectedEmail(order, transaction);
                                 }
                             } else {
                                 console.error("Could not fetch order details for email sending.");
                             }
                        } catch (emailErr) {
                            console.error("Error in email flow:", emailErr);
                        }
                    }
                }
            } catch (syncErr) {
                console.error("Error syncing Venndelo status:", syncErr.message);
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
