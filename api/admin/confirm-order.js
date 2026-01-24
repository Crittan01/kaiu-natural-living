import { verifyAdminToken } from './auth-helper.js';

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

    const { orderId, action } = req.body; // action: 'CONFIRMED' | 'REJECTED'
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

    if (!orderId || !action) {
        return res.status(400).json({ error: 'Faltan parámetros' });
    }

    try {
        const response = await fetch(`https://api.venndelo.com/v1/admin/orders/${orderId}/modify-order-confirmation-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            },
            body: JSON.stringify({
                confirmation_status: action
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Error Confirming Order:", data);
            return res.status(response.status).json({ error: 'Error actualizando orden', details: data });
        }

        return res.status(200).json({ success: true, data });

    } catch (error) {
        console.error("Error Admin Confirm:", error);
        return res.status(500).json({ error: 'Error Interno' });
    }
}
