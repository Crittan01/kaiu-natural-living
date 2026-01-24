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
      
      // Strategy: Since API doesn't support direct filter by PIN/Guide,
      // we fetch the last 100 orders and find the match manually.
      // This is efficient enough for the current scale.
      
      const response = await fetch(`https://api.venndelo.com/v1/admin/orders?page_size=100&status=ANY`, {
          method: 'GET',
          headers: {
            'X-Venndelo-Api-Key': VENNDELO_API_KEY
          }
      });
  
      if (!response.ok) {
          return res.status(response.status).json({ error: 'Error consultando Venndelo' });
      }
  
      const data = await response.json();
      const orders = data.items || data.results || [];

      // Flexible Search: Match ID, PIN, or Tracking Number
      const searchStr = String(id).trim();
      
      const match = orders.find(o => 
          String(o.id) === searchStr ||
          String(o.pin) === searchStr ||
          (o.shipments && o.shipments.some(s => s.tracking_number === searchStr))
      );

      if (!match) {
          return res.status(404).json({ error: 'Orden no encontrada. Verifique el PIN o # de Guía.' });
      }
  
      const shipment = match.shipments?.[0];

      // FILTER SAFE FIELDS ONLY
      const safeData = {
          id: match.id,
          pin: match.pin,
          status: match.status, // e.g., PENDING, APPROVED, SENT
          fulfillment_status: match.fulfillment_status,
          tracking_url: match.tracking_url || null, 
          carrier: shipment?.carrier_name || null,
          tracking_number: shipment?.tracking_number || null,
          created_at: match.created_at,
          total: match.total
      };
  
      return res.status(200).json(safeData);
  
    } catch (error) {
      console.error('Error tracking order:', error);
      return res.status(500).json({ error: 'Error Interno' });
    }
  }
