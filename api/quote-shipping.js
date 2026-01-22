import { z } from 'zod';

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
  payment_method_code: z.string().default('EXTERNAL_PAYMENT')
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
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
    if (!VENNDELO_API_KEY) throw new Error('Falta VENNDELO_API_KEY');

    // Validación de entrada
    const result = quoteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos de cotización inválidos', details: result.error.format() });
    }

    const { city_code, subdivision_code, line_items, payment_method_code } = result.data;

    // Construcción del payload para Venndelo
    // IMPORTANTE: pickup_info debe coincidir con el origen configurado en ENV para que el cálculo sea real (Bogotá -> Destino)
    const payload = {
      pickup_info: {
        city_code: process.env.VENNDELO_PICKUP_CITY_CODE, 
        subdivision_code: process.env.VENNDELO_PICKUP_SUBDIVISION_CODE, 
        country_code: process.env.VENNDELO_PICKUP_COUNTRY || "CO"
      },
      shipping_info: {
        city_code,
        subdivision_code,
        country_code: "CO"
      },
      line_items: line_items.map(item => ({
        sku: "GENERIC", // SKU Genérico solo para cotizar
        name: "Producto",
        unit_price: item.unit_price,
        free_shipping: false,
        height: item.height,
        width: item.width,
        length: item.length,
        dimensions_unit: item.dimensions_unit,
        weight: item.weight,
        weight_unit: item.weight_unit,
        quantity: item.quantity
      })),
      payment_method_code
    };

    // Llamada al endpoint de cotización de Venndelo
    const venndeloRes = await fetch('https://api.venndelo.com/v1/admin/orders/quotation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Venndelo-Api-Key': VENNDELO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await venndeloRes.json();

    if (!venndeloRes.ok) {
        // console.error('Error Cotización Venndelo:', JSON.stringify(data, null, 2));
        return res.status(venndeloRes.status).json({ 
          error: 'Error al calcular costos de envío', 
          venndelo_message: data.message || JSON.stringify(data),
          details: data 
        });
    }

    // Respuesta exitosa con el valor cotizado
    return res.status(200).json({ 
        success: true, 
        shipping_cost: data.quoted_shipping_total || 0,
        data: data 
    });

  } catch (error) {
    console.error('Error interno server cotización:', error);
    return res.status(500).json({ error: 'Error Interno del Servidor' });
  }
}
