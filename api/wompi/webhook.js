
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

        const { id, reference, amount_in_cents, status } = data.transaction;
        
        // 1. Verificar Integridad (Síncrono y Rápido)
        const secret = process.env.WOMPI_INTEGRITY_SECRET;
        if (!secret) return res.status(500).json({ error: "Configuración incompleta" });

        const integrityString = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
        const generatedSignature = crypto.createHash('sha256').update(integrityString).digest('hex');

        if (generatedSignature !== signature.checksum) {
            console.error("Error Integridad Wompi");
            return res.status(400).json({ error: "Integridad fallida" });
        }

        // 2. Responder INMEDIATAMENTE a Wompi (Para evitar timeouts)
        // Wompi espera un 200 OK en < X segundos.
        res.status(200).json({ success: true });

        // 3. Procesar Lógica de Negocio (Asíncrono / Fire & Forget)
        // Nota: Esto funciona bien en servidores persistentes (Express). 
        // En Serverless (Vercel Functions), esto podría interrumpirse si la función se congela.
        // Dado que usamos server.mjs local/VPS, es seguro.
        processOrderAsync(req.body).catch(err => {
            console.error("❌ CRITICAL: Error procesando orden en background:", err);
        });

    } catch (error) {
        console.error("Error Webhook Handler:", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal Error" });
        }
    }
}

/**
 * Lógica pesada de procesamiento de orden
 */
async function processOrderAsync(body) {
    const { data } = body;
    const { reference, status } = data.transaction;
    
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
    const pinStr = reference.split('-')[1]; // KAIU-12345 -> 12345
    const pin = parseInt(pinStr, 10);

    console.log(`🔄 Procesando en Background: ${reference} (${status})`);

    // Buscar Order en DB Local
    let dbOrder = null;
    if (!isNaN(pin)) {
            dbOrder = await prisma.order.findFirst({
                where: { readableId: pin },
                include: { items: true }
            });
    }
    
    // Fallback: Try externalId
    if (!dbOrder) {
            dbOrder = await prisma.order.findFirst({
                where: { externalId: pinStr },
                include: { items: true }
            });
    }

    if (!dbOrder) {
        console.warn(`⚠️ Orden DB no encontrada para referencia ${reference}. Intentando sincronización legacy...`);
        // Aquí podríamos intentar crearla si no existe, pero por ahora solo logueamos.
        return; 
    }
    
    const venndeloId = dbOrder.externalId || pinStr; 

    // Helper para Venndelo
    const updateVenndeloStatus = async (id, newStatus) => {
            if (!id) return;
            try {
            console.log(`📡 Llamando a Venndelo para actualizar status a ${newStatus}...`);
            const vRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${id}/modify-order-confirmation-status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Venndelo-Api-Key': VENNDELO_API_KEY },
                body: JSON.stringify({ confirmation_status: newStatus })
            });
            if(!vRes.ok) console.error("Error respuesta Venndelo:", await vRes.text());
            else console.log("✅ Venndelo actualizado.");

            } catch (e) { console.error("Error Network Venndelo:", e.message); }
    };

    if (status === 'APPROVED') {
        console.log("💰 PAGO APROBADO -> Confirmando Orden");
        // 1. Venndelo -> CONFIRMED
        await updateVenndeloStatus(venndeloId, 'CONFIRMED');
        
        // 2. DB -> STATUS: CONFIRMED
        await prisma.order.update({
            where: { id: dbOrder.id },
            data: { status: 'CONFIRMED' }
        });
        
        // 3. Inventory -> Confirm Sale
        await InventoryService.confirmSale(dbOrder.items);
        console.log("📦 Inventario actualizado y orden confirmada.");

    } else if (['DECLINED', 'VOIDED', 'ERROR'].includes(status)) {
        console.log(`🚫 PAGO RECHAZADO (${status}) -> Cancelando Orden`);
        // 1. Venndelo -> REJECTED
        await updateVenndeloStatus(venndeloId, 'REJECTED');

        // 2. DB -> STATUS: CANCELLED
        await prisma.order.update({
            where: { id: dbOrder.id },
            data: { status: 'CANCELLED' }
        });

        // 3. Inventory -> Release Stock
        await InventoryService.releaseReserve(dbOrder.items);
        console.log("♻️ Stock liberado.");
    }
}
