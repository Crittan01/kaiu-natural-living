import { z } from 'zod';

// Schema de Validación (Espejo de lo que pide Venndelo)
const createOrderSchema = z.object({
  pickup_info: z.object({
    contact_name: z.string(),
    contact_phone: z.string(),
    address_1: z.string(),
    city_code: z.string(),
    subdivision_code: z.string(),
    country_code: z.string(),
  }).optional(), // Optional because we fill it in backend
  billing_info: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    identification_type: z.string(),
    identification: z.string(),
  }),
  shipping_info: z.object({
    first_name: z.string(),
    last_name: z.string(),
    address_1: z.string(),
    city_code: z.string(),
    subdivision_code: z.string(),
    country_code: z.string(),
    phone: z.string(),
  }),
  line_items: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    unit_price: z.number(),
    quantity: z.number(),
    weight: z.number(),
    weight_unit: z.enum(['KG']),
    dimensions_unit: z.enum(['CM']),
    height: z.number(),
    width: z.number(),
    length: z.number(),
    type: z.enum(['STANDARD', 'VIRTUAL']).default('STANDARD'),
    variation_id: z.number().nullable().optional(),
    free_shipping: z.boolean().nullable().optional(),
  })),
  payment_method_code: z.enum(['COD', 'EXTERNAL_PAYMENT']),
  external_order_id: z.string(),
  discounts: z.array(z.object({
    type: z.enum(['GLOBAL']),
    amount: z.number()
  })).optional().default([]),
});

export default async function handler(req, res) {
  // 1. CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    // 2. Validación de Entorno
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
    if (!VENNDELO_API_KEY) {
      console.error('SERVER ERROR: VENNDELO_API_KEY missing');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // 3. Validación de Datos (Zod)
    const result = createOrderSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: result.error.format() 
      });
    }

    const orderData = result.data;
    // console.log("📡 [API] Recibido Payload Validado:", JSON.stringify(orderData, null, 2));

    // FIX: Bogota D.C. often has Dept 25 in frontend lists but Dept 11 in official DANE/Venndelo
    if (orderData.shipping_info.city_code === '11001000' && orderData.shipping_info.subdivision_code === '25') {
        console.log("⚠️ Corrigiendo código departamento Bogotá: 25 -> 11");
        orderData.shipping_info.subdivision_code = '11';
    }
    // Ensure postal_code is present (using 000000 as placeholder if empty is rejected)
    if (!orderData.shipping_info.postal_code) {
        orderData.shipping_info.postal_code = "000000";
    }

    // Inject missing strictly required fields for line items
    orderData.line_items = orderData.line_items.map(item => ({
        ...item,
        variation_id: item.variation_id ?? null,
        free_shipping: item.free_shipping ?? false
    }));

    // 4. Enviar a Venndelo (Intento 1: Ciudad Real)
    // Construct pickup info from environment variables or defaults
    // Construct pickup info from environment variables or defaults

    // Clean up payload fields
    
    // Billing Info Cleaning - Basic Trim
    orderData.billing_info.first_name = orderData.billing_info.first_name.trim();
    orderData.billing_info.last_name = orderData.billing_info.last_name.trim();
    // Keep ID cleaning just to be safe (nums only is standard for cedula) but could relax if needed
    orderData.billing_info.identification = orderData.billing_info.identification.trim(); 

    // Shipping Info Cleaning - Basic Trim
    orderData.shipping_info.address_1 = orderData.shipping_info.address_1.trim();
    orderData.shipping_info.postal_code = ""; // Empty string explicitly

    // Line Items Cleaning
    orderData.line_items = orderData.line_items.map(item => {
        // Remove null/undefined keys explicitly by destructuring
        const { variation_id, free_shipping, ...rest } = item;
        return {
            ...rest,
            type: "STANDARD" // Revert to STANDARD as requested
        };
    });

    // 4. Enviar a Venndelo (Intento 1: Ciudad Real)
    // console.log("DEBUG ENV inside handler:", process.env.VENNDELO_PICKUP_NAME);
    
    const pickupInfo = {
      contact_name: process.env.VENNDELO_PICKUP_NAME,
      contact_phone: process.env.VENNDELO_PICKUP_PHONE,
      address_1: process.env.VENNDELO_PICKUP_ADDRESS,
      city_code: process.env.VENNDELO_PICKUP_CITY_CODE,
      subdivision_code: process.env.VENNDELO_PICKUP_SUBDIVISION_CODE,
      country_code: process.env.VENNDELO_PICKUP_COUNTRY,
      postal_code: "" 
    };

    // Clean up discounts
    if (!orderData.discounts) {
        orderData.discounts = [];
    }

    // Override the orderData pickup_info with our server-side config
    orderData.pickup_info = pickupInfo;
    orderData.confirmation_status = 'PENDING';
    
    // Dynamic Payment Method (COD or EXTERNAL_PAYMENT)
    // If not provided in body, fallback to EXTERNAL_PAYMENT for safety similar to previous behavior, 
    // but the schema validation allows COD now.
    orderData.payment_method_code = req.body.payment_method_code || 'EXTERNAL_PAYMENT'; 

    // Log the FINAL payload being sent (crucial for debugging)
    // console.log("🚀 [API] Enviando Payload Sanitizado a Venndelo:", JSON.stringify(orderData, null, 2));

    let venndeloResponse = await fetch('https://api.venndelo.com/v1/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Venndelo-Api-Key': VENNDELO_API_KEY
      },
      body: JSON.stringify(orderData)
    });

    let data = await venndeloResponse.json();

    // 5. Manejo de Errores y Reintento (Estrategia Antiprohibiciones)
    if (!venndeloResponse.ok) {
        console.log("Venndelo Initial Error:", JSON.stringify(data));
        
        // Detectar si es error de cobertura (APP_PUBLIC_ERROR)
        // Buscamos "Tarifa" o "transporte" para ser más genericos
        const errorString = JSON.stringify(data);
        const isCoverageError = errorString.includes("Tarifa") || errorString.includes("transporte") || errorString.includes("APP_PUBLIC_ERROR");
        
        if (isCoverageError) {
             
             // Diccionario de Fallback (Capitales por Departamento)
             const FALLBACK_CITIES = {
                 "05": "05001000", // Antioquia -> Medellin
                 "11": "11001000", // Bogota -> Bogota
                 "25": "25001000", // Cundinamarca -> Agua de Dios
                 "54": "54001000", // Norte de Santander -> Cúcuta
                 "76": "76001000", // Valle -> Cali
                 "08": "08001000", // Atlantico -> Barranquilla
                 "13": "13001000", // Bolivar -> Cartagena
             };

             const departmentCode = orderData.shipping_info.subdivision_code;
             console.log(`Detectado error de cobertura para Dept: ${departmentCode}. Buscando fallback...`);
             
             const fallbackCity = FALLBACK_CITIES[departmentCode];

             if (fallbackCity && fallbackCity !== orderData.shipping_info.city_code) {
                 console.log(`Reintentando con ciudad fallback: ${fallbackCity}`);
                 
                 // Clonamos y modificamos para el reintento
                 const retryOrder = JSON.parse(JSON.stringify(orderData));
                 
                 // Ponemos la nota de la ciudad real en la dirección o notas
                 const originalCityCode = retryOrder.shipping_info.city_code;
                 retryOrder.shipping_info.address_1 = `DESTINO REAL ${originalCityCode} ${retryOrder.shipping_info.address_1}`;
                 
                 // Cambiamos la ciudad logística a la capital
                 retryOrder.shipping_info.city_code = fallbackCity;

                 // Reintentamos
                 console.log("📦 Payload Reintento:", JSON.stringify(retryOrder, null, 2));
                 venndeloResponse = await fetch('https://api.venndelo.com/v1/admin/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Venndelo-Api-Key': VENNDELO_API_KEY
                    },
                    body: JSON.stringify(retryOrder)
                });
                data = await venndeloResponse.json();
                console.log("Resultado Reintento:", venndeloResponse.ok ? "EXITO" : "FALLO");
             } else {
                 console.log("No hay ciudad fallback configurada o es la misma.");
             }
        }
    }

    if (!venndeloResponse.ok) {
       console.error('VENNDELO ERROR:', JSON.stringify(data, null, 2));
       return res.status(venndeloResponse.status).json({ 
         error: 'Error creating order in Venndelo', 
         venndelo_message: data?.message || 'Unknown error',
         details: data
       });
    }

    // 6. Éxito
    return res.status(201).json({ success: true, order: data });

  } catch (error) {
    console.error('INTERNAL SERVER ERROR:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
