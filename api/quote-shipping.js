import { z } from 'zod';

const quoteSchema = z.object({
  city_code: z.string(),
  subdivision_code: z.string(),
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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
    if (!VENNDELO_API_KEY) throw new Error('VENNDELO_API_KEY missing');

    const result = quoteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid data', details: result.error.format() });
    }

    const { city_code, subdivision_code, line_items, payment_method_code } = result.data;

    const payload = {
      pickup_info: {
        city_code: "05001000", // MEDELLIN (Origen Bodega - Configurar real)
        subdivision_code: "05", // ANTIOQUIA
        country_code: "CO"
      },
      shipping_info: {
        city_code,
        subdivision_code,
        country_code: "CO"
      },
      line_items: line_items.map(item => ({
        sku: "GENERIC",
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
        console.error('Venndelo Quote Error:', JSON.stringify(data, null, 2));
        return res.status(venndeloRes.status).json({ 
          error: 'Error calculating shipping', 
          venndelo_message: data.message || JSON.stringify(data),
          details: data 
        });
    }

    // Retornamos el valor cotizado
    return res.status(200).json({ 
        success: true, 
        shipping_cost: data.quoted_shipping_total || 0,
        data: data 
    });

  } catch (error) {
    console.error('Server logic error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
