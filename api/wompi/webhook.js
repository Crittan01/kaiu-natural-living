
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
            console.error("❌ Webhook inválido: Datos incompletos");
            return res.status(400).json({ error: "Datos incompletos" });
        }

        const { id, reference, amount_in_cents, currency, status } = data.transaction;
        
        console.log(`🔹 Transacción ID: ${id}`);
        console.log(`🔹 Referencia: ${reference}`);
        console.log(`🔹 Estado: ${status}`);
        console.log(`🔹 Monto: ${amount_in_cents} ${currency}`);

        // 1. Verificar Integridad (Checksum)
        // SHA256(id + status + amount_in_cents + timestamp + secret)
        const secret = process.env.WOMPI_INTEGRITY_SECRET; // Debe estar en .env.local

        if (!secret) {
            console.error("❌ ERROR CRÍTICO: WOMPI_INTEGRITY_SECRET no configurado.");
            return res.status(500).json({ error: "Configuración del servidor incompleta" });
        }

        const integrityString = `${id}${status}${amount_in_cents}${timestamp}${secret}`;
        const generatedSignature = crypto.createHash('sha256').update(integrityString).digest('hex');

        if (generatedSignature !== signature.checksum) {
            console.error("❌ Error de Integridad: Las firmas no coinciden.");
            console.error(`   Recibida: ${signature.checksum}`);
            console.error(`   Generada: ${generatedSignature}`);
            return res.status(400).json({ error: "Error de integridad" });
        }

        console.log("✅ Integridad Verificada.");

        // 2. Procesar Orden según Estado
        if (status === 'APPROVED') {
            console.log("💰 PAGO APROBADO. Creando orden en Venndelo...");
            
            // Aquí llamaríamos a la lógica para crear la orden en Venndelo
            // O actualizaríamos una base de datos local.
            // Por ahora, en este MVP sin DB propia persistente, 
            // intentaremos enviar los datos a Venndelo si tenemos suficientes datos en el reference
            // O simplemente logueamos el éxito.
            
            // TODO: Parsear reference para obtener datos del cliente si se codificaron ahí,
            // o usar una base de datos intermedia (Redis/Mongo) para recuperar el carrito.
            
        } else {
            console.log(`⚠️ Transacción no aprobada. Estado: ${status}`);
        }

        // 3. Responder a Wompi lo antes posible
        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("❌ Error en Webhook:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
