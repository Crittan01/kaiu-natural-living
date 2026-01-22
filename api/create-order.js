import { z } from 'zod';

// Esquema de Validación (Espejo de lo que pide Venndelo)
const createOrderSchema = z.object({
  pickup_info: z.object({
    contact_name: z.string(),
    contact_phone: z.string(),
    address_1: z.string(),
    city_code: z.string(),
    subdivision_code: z.string(),
    country_code: z.string(),
  }).optional(), // Opcional porque se llena en el backend
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
    // Codigo postal puede venir vacio, lo manejamos luego
    postal_code: z.string().optional().default(""), 
  }),
  line_items: z.array(z.object({
    sku: z.string(),
    name: z.string(),
    unit_price: z.number(),
    quantity: z.number(),
    // Logistica (Obligatorios para Venndelo)
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
  // Metodo de pago dinamico
  payment_method_code: z.enum(['COD', 'EXTERNAL_PAYMENT']),
  external_order_id: z.string(),
  discounts: z.array(z.object({
    type: z.enum(['GLOBAL']),
    amount: z.number()
  })).optional().default([]),
});

export default async function handler(req, res) {
  // 1. Configuración de CORS
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
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  try {
    // 2. Validación de Entorno (API Key)
    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;
    if (!VENNDELO_API_KEY) {
      console.error('ERROR SERVIDOR: Falta VENNDELO_API_KEY');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    // 3. Validación de Datos de Entrada (Zod)
    const result = createOrderSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Datos inválidos', 
        details: result.error.format() 
      });
    }

    const orderData = result.data;

    // CORRECCIÓN ESPECÍFICA: Código de Departamento Bogotá
    // A veces el frontend envía '25' (Cundinamarca) para Bogotá, pero Venndelo/DANE requiere '11'.
    if (orderData.shipping_info.city_code === '11001000' && orderData.shipping_info.subdivision_code === '25') {
        // console.log("⚠️ Corrigiendo código departamento Bogotá: 25 -> 11");
        orderData.shipping_info.subdivision_code = '11';
    }
    
    // Asegurar código postal (Venndelo a veces rechaza vacíos estrictos, usamos "000000" si falla, o string vacío si lo permite)
    // En pruebas recientes, string vacío "" funciona mejor que null.
    if (!orderData.shipping_info.postal_code) {
        orderData.shipping_info.postal_code = "";
    }

    // Limpieza de Items (Eliminar campos nulos no permitidos)
    orderData.line_items = orderData.line_items.map(item => {
        const { variation_id, free_shipping, ...rest } = item;
        return {
            ...rest,
            // Aseguramos nulos explicitos o eliminacion
            variation_id: variation_id ?? null,
            free_shipping: free_shipping ?? false,
            type: "STANDARD" // Forzamos STANDARD para productos físicos con dimensiones
        };
    });

    // 4. Configuración de Origen (Bodega)
    // Se toma de variables de entorno para no quemar direcciones en código
    const pickupInfo = {
      contact_name: process.env.VENNDELO_PICKUP_NAME,
      contact_phone: process.env.VENNDELO_PICKUP_PHONE,
      address_1: process.env.VENNDELO_PICKUP_ADDRESS,
      city_code: process.env.VENNDELO_PICKUP_CITY_CODE,
      subdivision_code: process.env.VENNDELO_PICKUP_SUBDIVISION_CODE,
      country_code: process.env.VENNDELO_PICKUP_COUNTRY,
      postal_code: "" 
    };

    // Sobreescribimos la info de recogida con la nuestra (seguridad)
    orderData.pickup_info = pickupInfo;
    orderData.confirmation_status = 'PENDING';
    
    // Método de Pago (Dinamico: COD o EXTERNAL)
    orderData.payment_method_code = req.body.payment_method_code || 'EXTERNAL_PAYMENT'; 

    // Limpieza básica de textos
    orderData.billing_info.first_name = orderData.billing_info.first_name.trim();
    orderData.billing_info.last_name = orderData.billing_info.last_name.trim();
    orderData.billing_info.identification = orderData.billing_info.identification.trim(); 
    orderData.shipping_info.address_1 = orderData.shipping_info.address_1.trim();

    // 5. Enviar Solicitud a Venndelo
    let venndeloResponse = await fetch('https://api.venndelo.com/v1/admin/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Venndelo-Api-Key': VENNDELO_API_KEY
      },
      body: JSON.stringify(orderData)
    });

    let data = await venndeloResponse.json();

    // 6. Manejo de Errores y Reintento (Fallback por Cobertura)
    if (!venndeloResponse.ok) {
        console.log("Error Inicial Venndelo:", JSON.stringify(data));
        
        // Detectar si es error de cobertura (Ej: Vereda no normalizada)
        const errorString = JSON.stringify(data);
        const isCoverageError = errorString.includes("Tarifa") || errorString.includes("transporte") || errorString.includes("APP_PUBLIC_ERROR");
        
        if (isCoverageError) {
             // Diccionario de Fallback: Si falla la ciudad específica, intentamos con la Capital del Departamento
             // Esto ayuda a "rescatar" órdenes mal geolocalizadas
             const FALLBACK_CITIES = {
                 "05": "05001000", // Antioquia -> Medellin
                 "11": "11001000", // Bogota -> Bogota
                 "25": "25001000", // Cundinamarca -> Agua de Dios (o cabecera cercana)
                 "54": "54001000", // Norte de Santander -> Cúcuta
                 "76": "76001000", // Valle -> Cali
                 "08": "08001000", // Atlantico -> Barranquilla
                 "13": "13001000", // Bolivar -> Cartagena
             };

             const departmentCode = orderData.shipping_info.subdivision_code;
             // console.log(`Reintentando con ciudad capital para Dept: ${departmentCode}`);
             
             const fallbackCity = FALLBACK_CITIES[departmentCode];

             if (fallbackCity && fallbackCity !== orderData.shipping_info.city_code) {
                 // Clonamos y modificamos
                 const retryOrder = JSON.parse(JSON.stringify(orderData));
                 
                 // Agregamos el código original a la dirección para que el transportista sepa
                 const originalCityCode = retryOrder.shipping_info.city_code;
                 retryOrder.shipping_info.address_1 = `DESTINO REAL COD-${originalCityCode} ${retryOrder.shipping_info.address_1}`;
                 retryOrder.shipping_info.city_code = fallbackCity;

                 // Reintento
                 venndeloResponse = await fetch('https://api.venndelo.com/v1/admin/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Venndelo-Api-Key': VENNDELO_API_KEY
                    },
                    body: JSON.stringify(retryOrder)
                });
                data = await venndeloResponse.json();
             }
        }
    }

    if (!venndeloResponse.ok) {
       console.error('ERROR VENNDELO FINAL:', JSON.stringify(data, null, 2));
       return res.status(venndeloResponse.status).json({ 
         error: 'Error creando orden en Venndelo', 
         venndelo_message: data?.message || 'Error desconocido',
         details: data
       });
    }

    // 7. Respuesta Exitosa
    return res.status(201).json({ success: true, order: data });

  } catch (error) {
    console.error('ERROR INTERNO SERVIDOR:', error);
    return res.status(500).json({ error: 'Error Interno del Servidor' });
  }
}
