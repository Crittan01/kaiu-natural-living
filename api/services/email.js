
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import https from 'https';

// Load Env if not already loaded
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

// Insecure Agent to bypass "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Generates the HTML for the Order Confirmation Email
 */
const generateOrderEmailHtml = (order, wompiTransaction) => {
    const { id, pin, billing_info, shipping_info, line_items, total, shipping_total } = order;
    
    // Logic for Shipping ID (PIN preferred)
    const displayId = pin || id;

    // Logic for Shipping Cost
    let shippingCost = 0;
    if (shipping_total !== undefined && shipping_total !== null) {
        shippingCost = parseFloat(shipping_total);
    } else {
        // Fallback calculation
        const subtotal = line_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        shippingCost = total - subtotal;
    }

    // Logic for Transaction Display
    const isCOD = wompiTransaction.payment_method?.type === 'PAGO_CONTRA_ENTREGA';
    const transactionLabel = isCOD ? 'Método' : 'Transacción Wompi';
    const transactionValue = isCOD ? 'Pago Contra Entrega' : wompiTransaction.id;

    const itemsHtml = line_items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toLocaleString('es-CO')}</td>
        </tr>
    `).join('');

    // Add Shipping Row if cost > 0
    const shippingHtml = shippingCost > 0 ? `
        <tr>
            <td style="padding: 10px; border-bottom: 2px solid #eee;"><strong>Envío</strong></td>
            <td style="padding: 10px; border-bottom: 2px solid #eee; text-align: center;">-</td>
            <td style="padding: 10px; border-bottom: 2px solid #eee; text-align: right;">$${shippingCost.toLocaleString('es-CO')}</td>
        </tr>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #C0D6DF; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #4F6D7A; margin: 0; font-size: 24px; }
            .order-details { margin-bottom: 30px; background: #F0F7F4; padding: 15px; border-radius: 5px; }
            .table-container { width: 100%; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; padding: 10px; background-color: #f4f4f4; color: #666; font-size: 12px; text-transform: uppercase; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #4F6D7A; margin-top: 20px; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
            .btn { display: inline-block; background-color: #4F6D7A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .info-box { background-color: #e8f4fd; border-left: 4px solid #2c5282; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ ¡Gracias por tu compra, ${billing_info.first_name}!</h1>
                <p>Tu pedido ha sido confirmado exitosamente.</p>
            </div>

            <div class="order-details">
                <p><strong>Pedido Venndelo:</strong> #${displayId}</p>
                <p><strong>${transactionLabel}:</strong> ${transactionValue}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
            </div>

            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th width="50%">Producto</th>
                            <th width="20%" style="text-align: center;">Cant.</th>
                            <th width="30%" style="text-align: right;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        ${shippingHtml}
                    </tbody>
                </table>
                <div class="total">
                    Total: $${Math.round(total).toLocaleString('es-CO')}
                </div>
            </div>

            <div class="info-box">
                <p style="margin: 0;"><strong>ℹ️ ¿Qué sigue?</strong><br>
                Estamos preparando tu pedido. Te enviaremos <strong>otro correo con el número de Guía</strong> apenas sea despachado (usualmente en las próximas 24-48 horas).</p>
            </div>

            <div style="margin-bottom: 30px;">
                <h3>📦 Datos de Envío</h3>
                <p>
                    ${shipping_info.first_name} ${shipping_info.last_name}<br>
                    ${shipping_info.address_1}<br>
                    ${shipping_info.phone}
                </p>
            </div>

            <div class="footer">
                <p>Si tienes alguna pregunta, responde a este correo o contáctanos por WhatsApp.</p>
                <p>© ${new Date().getFullYear()} KAIU Natural Living</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Sends Order Confirmation Email (Using Robust Fetch)
 */
export const sendOrderConfirmation = async (order, wompiTransaction) => {
    try {
        const key = process.env.RESEND_API_KEY;
        if (!key) {
            console.warn("⚠️ SKIPPING EMAIL: No RESEND_API_KEY found.");
            return;
        }

        const emailHtml = generateOrderEmailHtml(order, wompiTransaction);
        const recipient = order.billing_info.email;
        const displayId = order.pin || order.id;

        console.log(`📧 Sending confirmation email to ${recipient} (via Secure Fetch)...`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                from: 'KAIU Natural Living <onboarding@resend.dev>',
                to: [recipient],
                subject: `Confirmación de Pedido KAIU #${displayId}`,
                html: emailHtml
            }),
            agent: httpsAgent // BYPASS SSL ERROR
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("❌ Resend API Error:", JSON.stringify(data, null, 2));
            return null;
        }

        console.log(`✅ Email Sent Successfully! ID: ${data.id}`);
        return data;

    } catch (error) {
        console.error("❌ Email Sending Exception:", error);
    }
};
/**
 * Generates the HTML for Shipping Confirmation
 */
const generateShippingEmailHtml = (order, trackingNumber, pdfUrl) => {
    const { id, shipping_info, line_items } = order;
    
    // Tracking URL: Redirect to our own tracking page or the carrier's
    // For now, let's point to our /rastreo page
    const trackingLink = `https://kaiu.com.co/rastreo?guide=${trackingNumber}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #C0D6DF; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #4F6D7A; margin: 0; font-size: 24px; }
            .highlight { background-color: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
            .tracking-number { font-size: 20px; font-weight: bold; color: #1565c0; display: block; margin: 10px 0; }
            .btn { display: inline-block; background-color: #4F6D7A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; margin-top: 10px; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="header">
                <h1>🚚 ¡Tu pedido está en camino!</h1>
                <p>Hola ${shipping_info.first_name}, buenas noticias.</p>
            </div>

            <p>Hemos despachado tu pedido <strong>#${id}</strong>. Aquí tienes los detalles para realizar el seguimiento:</p>

            <div class="highlight">
                <span style="font-size: 14px; color: #666;">Número de Guía</span>
                <span class="tracking-number">${trackingNumber}</span>
                <a href="${trackingLink}" class="btn">Rastrear Pedido</a>
            </div>

            <p><strong>Destino:</strong><br/>
            ${shipping_info.address_1}<br/>
            ${shipping_info.phone}</p>

            <p style="font-size: 13px; color: #666;">
                *Puede tomar unas horas para que la transportadora actualice el estado inicial.
            </p>

            <div class="footer">
                <p>KAIU Natural Living</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Sends Shipping Confirmation Email
 */
export const sendShippingConfirmation = async (order, trackingNumber, pdfUrl = '') => {
    try {
        const key = process.env.RESEND_API_KEY;
        if (!key) return;

        const emailHtml = generateShippingEmailHtml(order, trackingNumber, pdfUrl);
        const recipient = order.billing_info.email; // Venndelo has email in billing info often

        console.log(`📧 Sending shipping email to ${recipient}...`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                from: 'KAIU Natural Living <onboarding@resend.dev>',
                to: [recipient],
                subject: `¡En camino! Tu pedido KAIU #${order.id} ha sido despachado`,
                html: emailHtml
            }),
            agent: httpsAgent
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("❌ Resend API Error (Shipping):", JSON.stringify(data, null, 2));
        } else {
            console.log(`✅ Shipping Email Sent! ID: ${data.id}`);
        }
    } catch (e) {
        console.error("❌ Shipping Email Exception:", e);
    }
};

/**
 * Generates the HTML for Payment Rejected Email
 */
const generateRejectedEmailHtml = (order, wompiTransaction) => {
    const { billing_info, id, pin } = order;
    const displayId = pin || id;
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px solid #e57373; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #d32f2f; margin: 0; font-size: 24px; }
            .status-box { background-color: #ffebee; color: #c62828; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .btn { display: inline-block; background-color: #4F6D7A; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    
    <body>
        <div class="container">
            <div class="header">
                <h1>❌ Pago Rechazado</h1>
            </div>

            <p>Hola ${billing_info.first_name},</p>
            <p>Tu intento de pago para el pedido <strong>#${displayId}</strong> no pudo ser completado.</p>

            <div class="status-box">
                <strong>Motivo Wompi:</strong> ${wompiTransaction.status}<br>
                <span style="font-size: 12px; color: #b71c1c;">(Transacción: ${wompiTransaction.id})</span>
            </div>

            <div style="background-color: #fafafa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}</p>
                <p style="margin: 5px 0;"><strong>💰 Total Intentado:</strong> $${Math.round(order.total).toLocaleString('es-CO')}</p>
            </div>

            <p>Es posible que tu banco haya bloqueado la transacción por seguridad o fondos insuficientes. <strong>No se ha realizado ningún cargo final a tu tarjeta.</strong></p>
            
            <p>Te invitamos a intentarlo nuevamente con otro medio de pago:</p>

            <div style="text-align: center;">
                <a href="https://kaiu.com.co/checkout" class="btn">Volver al Checkout</a>
            </div>

            <div class="footer">
                <p>KAIU Natural Living</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Sends Payment Rejected Email
 */
export const sendPaymentRejectedEmail = async (order, wompiTransaction) => {
    try {
        const key = process.env.RESEND_API_KEY;
        if (!key) return;

        const emailHtml = generateRejectedEmailHtml(order, wompiTransaction);
        const recipient = order.billing_info.email;
        const displayId = order.pin || order.id;

        console.log(`📧 Sending REJECTED email to ${recipient}...`);
        
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify({
                from: 'KAIU Natural Living <onboarding@resend.dev>',
                to: [recipient],
                subject: `⚠️ Pago Rechazado - Pedido KAIU #${displayId}`,
                html: emailHtml
            }),
            agent: httpsAgent
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("❌ Resend API Error (Rejected):", JSON.stringify(data, null, 2));
        } else {
            console.log(`✅ Rejected Email Sent! ID: ${data.id}`);
        }

    } catch (e) {
        console.error("❌ Rejected Email Exception:", e);
    }
};
