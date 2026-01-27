
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
        console.log(`Monto: ${amount_in_cents} ${currency}`);

        // 1. Verificar Integridad (Checksum)
        // SHA256(id + status + amount_in_cents + timestamp + secret)
        const secret = process.env.WOMPI_INTEGRITY_SECRET; // Debe estar en .env.local

        if (!secret) {
            console.error("ERROR CRÍTICO: WOMPI_INTEGRITY_SECRET no configurado.");
            return res.status(500).json({ error: "Configuración del servidor incompleta" });
        }

        const integrityString = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
        const generatedSignature = crypto.createHash('sha256').update(integrityString).digest('hex');

        if (generatedSignature !== signature.checksum) {
            console.error("Error de Integridad: Las firmas no coinciden.");
            console.error(`   Recibida: ${signature.checksum}`);
            console.error(`   Generada: ${generatedSignature}`);
            return res.status(400).json({ error: "Error de integridad" });
        }

        console.log("Integridad Verificada.");

        // 2. Procesar Orden según Estado
        const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
        // La referencia viene como "KAIU-975200" o "KAIU-TMP-123456"
        // Si es TMP, no podemos actualizar en Venndelo porque no es ID real (aunque el nuevo flujo usa ID real)
        const venndeloId = reference.split('-')[1]; 

        // Helper para actualizar Venndelo
        const updateVenndeloStatus = async (id, newStatus) => {
            if (!id || isNaN(id)) {
                console.log(`ID Venndelo no válido para actualización: ${id}`);
                return; 
            }
            try {
                const vRes = await fetch(`https://api.venndelo.com/v1/admin/orders/${id}/modify-order-confirmation-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Venndelo-Api-Key': VENNDELO_API_KEY
                    },
                    body: JSON.stringify({ confirmation_status: newStatus })
                });
                const vData = await vRes.json();
                console.log(`Venndelo Update [${id} -> ${newStatus}]:`, vData.message || vData.status || vData);
            } catch (err) {
                console.error("Error actualizando Venndelo:", err.message);
            }
        };

        if (status === 'APPROVED') {
            console.log("PAGO APROBADO. Confirmando orden en Venndelo...");
            await updateVenndeloStatus(venndeloId, 'CONFIRMED');
            
        } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
            console.log(`Transacción fallida (${status}). Cancelando orden Venndelo...`);
            await updateVenndeloStatus(venndeloId, 'REJECTED'); // O CANCELLED según API
        } else {
             console.log(`Estado desconocido: ${status}, no se toma acción.`);
        }

        // 3. Responder a Wompi lo antes posible
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Error en Webhook:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
