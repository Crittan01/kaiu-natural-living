import { verifyAdminToken } from './auth-helper.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // 1. Verificar Autenticación
    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

    try {
        // Consultar API Venndelo (Pagina 1, 50 items por defecto para este dashboard simple)
        // Explicitly asking for status=ANY to ensure we see everything
        const response = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=50&status=ANY`, {
            headers: {
                'X-Venndelo-Api-Key': VENNDELO_API_KEY
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Error consultando Venndelo' });
        }

        const data = await response.json();
        
        // Debug
        // console.log("Venndelo Orders Structure:", Object.keys(data));
        
        return res.status(200).json(data);

    } catch (error) {
        console.error("Error Admin Orders:", error);
        return res.status(500).json({ error: 'Error Interno' });
    }
}
