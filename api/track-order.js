export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    const { id } = req.query;
  
    if (!id) {
      return res.status(400).json({ error: 'Falta parametro ID' });
    }
  
    try {
      const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
      
      // Venndelo doesn't strictly have a public tracking endpoint for end-users by default in documentation
      // But usually 'GET /orders/:id' works for admin. We proxy this carefully.
      // NOTE: Exposing full admin order details to public might be sensitive.
      // ideally we should only return status.
      
      const response = await fetch(`https://api.venndelo.com/v1/admin/orders/${id}`, {
          method: 'GET',
          headers: {
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
          }
      });
  
      if (!response.ok) {
          if (response.status === 404) return res.status(404).json({ error: 'Orden no encontrada' });
          return res.status(response.status).json({ error: 'Error consultando Venndelo' });
      }
  
      const data = await response.json();
  
      // FILTER SAFE FIELDS ONLY
      const safeData = {
          id: data.id,
          status: data.status, // e.g., PENDING, APPROVED, SENT
          fulfillment_status: data.fulfillment_status,
          tracking_url: data.tracking_url || null, // Guia de transporte if available
          created_at: data.created_at,
          total: data.total
      };
  
      return res.status(200).json(safeData);
  
    } catch (error) {
      console.error('Error tracking order:', error);
      return res.status(500).json({ error: 'Error Interno' });
    }
  }
