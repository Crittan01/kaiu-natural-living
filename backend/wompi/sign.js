import crypto from 'crypto';

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Usa POST para firmar transacciones' });
    }

    try {
        const { reference, amount, currency } = req.body;
        const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;

        // Validation
        if (!reference || !amount || !currency) {
            return res.status(400).json({ error: 'Faltan parámetros (reference, amount, currency)' });
        }

        if (!integritySecret || integritySecret.includes('XXXXXX')) {
             console.error("Wompi Integrity Secret no configurado");
             return res.status(500).json({ error: 'Configuración de servidor incompleta (Llaves Faltantes)' });
        }

        // Formula: SHA256(Reference + AmountInCents + Currency + Secret)
        // Check Wompi docs: Amount must be in cents string? 
        // Docs: "Cadena concatenada de la Referencia + Monto en centavos + Moneda + Secreto"
        
        const rawString = `${reference}${amount}${currency}${integritySecret}`;
        const signature = crypto.createHash('sha256').update(rawString).digest('hex');

        return res.status(200).json({ 
            signature,
            reference, // Echo back
            hashString: process.env.NODE_ENV === 'development' ? rawString : undefined // Debug helper
        });

    } catch (error) {
        console.error("Signature Error:", error);
        return res.status(500).json({ error: 'Error generando firma' });
    }
}
