import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      // 1. Try to resolve the input (which could be readableId "48", UUID, or Guide) to a Venndelo/External ID via our DB
      const searchInput = String(id).trim();
      let externalIdToSearch = searchInput;
      let readableIdFound = null;

      // Check if input is a number (Reader-friendly ID like 48)
      // AND fits in a 32-bit integer (Postgres INT4 limit is ~2.1 billion)
      const isNumeric = /^\d+$/.test(searchInput);
      const MAX_INT4 = 2147483647;
      const safeInt = isNumeric ? parseInt(searchInput) : null;
      const isReadableId = safeInt !== null && safeInt <= MAX_INT4;
      
      const whereClause = {
        OR: [
            ...(isReadableId ? [{ readableId: safeInt }] : []), 
            { id: searchInput },
            { externalId: searchInput },
            { trackingNumber: searchInput }
        ]
      };

      const localOrder = await prisma.order.findFirst({
         where: whereClause
      });

      if (localOrder) {
          if (localOrder.externalId) {
             externalIdToSearch = localOrder.externalId;
          }
          readableIdFound = localOrder.readableId;
      }

      // 2. Fetch from Venndelo (We still need this for live Shipping Status)
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

      // 3. Match in Venndelo List
      // We search by the resolved externalId (from DB) OR the original input (as fallback)
      const match = orders.find(o => 
          String(o.id) === externalIdToSearch ||
          String(o.pin) === externalIdToSearch ||
          (o.shipments && o.shipments.some(s => s.tracking_number === externalIdToSearch))
      );

      if (!match) {
          // If found in DB but not in Venndelo (e.g. older order not in last 100, or not synced)
          // We return local data if available
          if (localOrder) {
              return res.status(200).json({
                id: localOrder.externalId || localOrder.id,
                readable_id: localOrder.readableId,
                status: localOrder.status, 
                created_at: localOrder.createdAt,
                total: localOrder.total,
                carrier: localOrder.carrier,
                tracking_number: localOrder.trackingNumber,
                tracking_url: localOrder.trackingUrl
              });
          }
          return res.status(404).json({ error: 'Orden no encontrada en sistema logístico.' });
      }
  
      const shipment = match.shipments?.[0];

      // FILTER SAFE FIELDS ONLY
      const safeData = {
          id: match.id,
          readable_id: readableIdFound || (isNumeric ? parseInt(searchInput) : null), // Use DB id or fallback
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
