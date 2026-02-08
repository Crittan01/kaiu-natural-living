import { createHash } from 'crypto';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    try {
      const { reference, amount_in_cents, currency } = req.body;
      const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET;
  
      if (!WOMPI_INTEGRITY_SECRET) {
          console.error("Falta WOMPI_INTEGRITY_SECRET en variables de entorno");
          return res.status(500).json({ error: 'Error de configuración de pagos' });
      }
  
      if (!reference || !amount_in_cents || !currency) {
          return res.status(400).json({ error: 'Faltan parámetros de transacción' });
      }
  
      // Cadena de concatenación oficial de Wompi:
      // referencia + monto_en_centavos + moneda + secreto_integridad
      const chain = `${reference}${amount_in_cents}${currency}${WOMPI_INTEGRITY_SECRET}`;
      
      // Generar Hash SHA256
      const signature = createHash('sha256').update(chain).digest('hex');
  
      return res.status(200).json({ 
          signature,
          reference,
          amount_in_cents,
          currency,
          public_key: process.env.WOMPI_PUBLIC_KEY // Enviamos la pública también para conveniencia del front
      });
  
    } catch (error) {
      console.error('Error generando firma Wompi:', error);
      return res.status(500).json({ error: 'Error Interno' });
    }
  }
