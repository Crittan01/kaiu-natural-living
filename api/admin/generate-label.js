import { verifyAdminToken } from './auth-helper.js';

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
        console.log("---- DEBUG GENERATE LABEL ----");
        console.log("Order IDs:", orderIds);

        // STEP 1: Ensure Shipment is Created
        const createRes = await fetch(`https://api.venndelo.com/v1/admin/shipping/create-shipments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            },
            body: JSON.stringify({ order_ids: orderIds })
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

        // STEP 2: Poll for Label
        // We try up to 20 times with 1.5s delay (~30 seconds max wait)
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            const payload = {
                order_ids: orderIds,
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
    
            const data = await response.json();
    
            if (!response.ok) {
                console.error("Error Venndelo Labels:", data);
                return res.status(response.status).json({ error: 'Error generando guía en Venndelo', details: data });
            }

            // check status
            if (data.status === 'SUCCESS' && data.data) {
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
