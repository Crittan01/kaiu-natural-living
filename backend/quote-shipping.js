import { z } from 'zod';
import LogisticsManager from './services/logistics/LogisticsManager.js';

// Esquema para validar los datos que llegan del frontend
const quoteSchema = z.object({
  city_code: z.string(), // Código DANE destino
  subdivision_code: z.string(), // Código DANE departamento destino
  line_items: z.array(z.object({
    weight: z.number().default(0.5),
    weight_unit: z.enum(['KG']).default('KG'),
    height: z.number().default(10),
    width: z.number().default(10),
    length: z.number().default(10),
    dimensions_unit: z.enum(['CM']).default('CM'),
    unit_price: z.number(),
    quantity: z.number()
  })),
  payment_method_code: z.string().default('EXTERNAL_PAYMENT') // COD vs EXTERNAL
});

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  try {
    // Validación de entrada
    const result = quoteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos de cotización inválidos', details: result.error.format() });
    }

    const { city_code, subdivision_code, line_items, payment_method_code } = result.data;

    // Origen: Se asume configurado internamente en el LogisticsManager (Bodega Principal)
    // Destino:
    const destination = { city_code, subdivision_code };

    // Usamos el Manager para obtener la mejor cotización
    // Esto abstrae si cotizamos con Venndelo, Coordinadora, etc.
    const bestQuote = await LogisticsManager.getBestQuote(
        null, // Origin (Null = Default Bodega)
        destination, 
        line_items, 
        payment_method_code
    );

    // Respuesta normalizada
    return res.status(200).json({ 
        success: true, 
        shipping_cost: bestQuote.cost,
        carrier: bestQuote.carrier,
        days: bestQuote.days,
        details: bestQuote // Debug info si se necesita
    });

  } catch (error) {
    console.error('Error interno server cotización:', error);
    return res.status(500).json({ 
        error: 'Error al calcular costos de envío', 
        message: error.message 
    });
  }
}
