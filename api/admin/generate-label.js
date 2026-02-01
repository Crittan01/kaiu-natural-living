import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';
import { sendShippingConfirmation } from '../services/email.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

    try {
        // Resolve External IDs (Venndelo IDs) from DB
        const dbOrders = await prisma.order.findMany({
            where: {
                id: { in: orderIds } // IDs are UUID strings, not Ints
            },
            select: { externalId: true, status: true }
        });

        const venndeloIds = dbOrders.map(o => o.externalId).filter(Boolean);

        if (venndeloIds.length === 0) {
            return res.status(404).json({ error: 'No se encontraron las órdenes enlazadas con Venndelo' });
        }

        console.log(`Processing Label Generation for Venndelo IDs: ${venndeloIds.join(', ')}`);

        // Check if orders are already in a state where shipment exists
        const skipCreation = dbOrders.some(o => 
            ['READY_TO_SHIP', 'PICKUP_REQUESTED', 'SHIPPED', 'DELIVERED'].includes(o.status)
        );

        if (!skipCreation) {
            // STEP 1: Ensure Shipment is Created
            const createRes = await fetch(`https://api.venndelo.com/v1/admin/shipping/create-shipments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Venndelo-Api-Key': VENNDELO_API_KEY
                },
                body: JSON.stringify({ order_ids: venndeloIds })
            });
            
            const createText = await createRes.text();
            console.log("Create Shipment Response:", createRes.status, createText);

            if (!createRes.ok) {
            // If it fails, report it.
            // Common error for prepaid: "Insufficient balance"
            if (!createText.includes("ya existe") && !createText.includes("already exists")) {
                    let errMsg = "Error creando envío en Venndelo";
                    try {
                        const errJson = JSON.parse(createText);
                        // Venndelo specific error structure sometimes is { error: { message: "..." } } or just { message: "..." }
                        errMsg = errJson.message || errJson.error?.message || errMsg;
                        errMsg = errMsg.trim();
                    } catch(e) {}
                    
                    // Return the cleaned up message directly
                    return res.status(400).json({ error: errMsg });
            }
            }
        } else {
            console.log("Skipping shipment creation (Shipment likely exists based on status)");
        }



        // STEP 2: Poll for Label
        // We try up to 20 times with 1.5s delay (~30 seconds max wait)
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            const payload = {
                order_ids: venndeloIds,
                format: "LABEL_10x15",
                output: "URL"
            };
    
            const response = await fetch(`https://api.venndelo.com/v1/admin/shipping/generate-labels`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Venndelo-Api-Key': VENNDELO_API_KEY
                },
                body: JSON.stringify(payload)
            });
    
            const genText = await response.text();
            let data;
            
            try {
                data = JSON.parse(genText);
            } catch (jsonErr) {
                console.error("❌ Venndelo Non-JSON Response:", genText);
                return res.status(502).json({ error: 'La transportadora retornó una respuesta inválida' });
            }
    
            if (!response.ok) {
                console.error("Error Venndelo Labels:", data);
                return res.status(response.status).json({ error: 'Error generando guía en Venndelo', details: data });
            }

            // check status
            if (data.status === 'SUCCESS' && data.data) {
                // --- EMAIL TRIGGER ---
                const pdfUrl = data.data;
                // Fetch latest order details to get the Tracking Number (Guía)
                // Venndelo updates the order with 'shipments' array immediately after label gen.
                try {
                     const venndeloOrderId = venndeloIds[0]; // Use Venndelo ID, not DB UUID
                     const orderRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${venndeloOrderId}`, {
                        headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
                     });
                     
                     if (orderRes.ok) {
                         const orderData = await orderRes.json();
                         const order = orderData.data || orderData; // Handle structure variations
                         
                         // Look for shipments
                         if (order.shipments && order.shipments.length > 0) {
                             const trackingNumber = order.shipments[0].tracking_number;
                             console.log(`🚚 Found Tracking #: ${trackingNumber}. Sending Email...`);
                             
                             // Find KAIU DB order to get readableId for customer display
                             // Try by externalId first, then by the venndeloIds array
                             let dbOrder = await prisma.order.findFirst({
                                 where: { externalId: String(venndeloOrderId) }
                             });
                             
                             // If not found, try matching against the order IDs from request
                             if (!dbOrder && dbOrderIds && dbOrderIds.length > 0) {
                                 dbOrder = await prisma.order.findFirst({
                                     where: { id: dbOrderIds[0] }
                                 });
                             }
                             
                             console.log(`📋 DB Order lookup: venndeloId=${venndeloOrderId}, found=${!!dbOrder}, readableId=${dbOrder?.readableId}`);
                             
                             // Enrich order with readableId for email
                             const enrichedOrder = {
                                 ...order,
                                 readableId: dbOrder?.readableId
                             };
                             
                             // Send Async (don't block response)
                             sendShippingConfirmation(enrichedOrder, trackingNumber, pdfUrl)
                                .then(() => console.log("Email task finished"))
                                .catch(err => console.error("Email task failed", err));
                         } else {
                             console.warn("⚠️ Label generated but no shipment info found in order yet.");
                         }
                     }
                } catch (emailErr) {
                    console.error("Error triggering shipping email:", emailErr);
                }
                // ---------------------

                return res.status(200).json(data);
            }
            
            if (data.status === 'ERROR' || (data.items && data.items[0] && data.items[0].status === 'ERROR')) {
                 // Fail fast
                 // Fail fast
                 console.error("Venndelo API Error during Label Gen");
                 const errorMsg = data.items?.[0]?.errors?.[0]?.message || 'Error desconocido generando guía';
                 return res.status(400).json({ error: errorMsg, details: data });
            }

            if (data.status === 'PROCESSING') {
                // Wait and retry
            }

            // Wait before next retry
            await sleep(1500);
        }
        
        // If timeout
        return res.status(202).json({ 
            status: 'PROCESSING', 
            message: 'La guía se está generando. Por favor espera 10 segundos y presiona el botón de nuevo.' 
        });

    } catch (error) {
        console.error("Error Admin Labels:", error);
        return res.status(500).json({ error: 'Error Interno' });
    }
}
