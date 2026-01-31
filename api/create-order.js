import { z } from 'zod';
import { sendOrderConfirmation } from './services/email.js';
import { prisma } from './db.js';
import InventoryService from './services/inventory/InventoryService.js';
import LogisticsManager from './services/logistics/LogisticsManager.js';

// Esquema de Validación (Espejo de lo que pide Venndelo)
const createOrderSchema = z.object({
  pickup_info: z.object({
    contact_name: z.string(),
    contact_phone: z.string(),
    address_1: z.string(),
    city_code: z.string(),
    subdivision_code: z.string(),
    country_code: z.string(),
  }).optional(), 
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
    postal_code: z.string().optional().default(""), 
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
  // 1. Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' })
  }

  try {
    // 2. Validación de Datos (Zod)
    const result = createOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: result.error.format() });
    }
    const orderData = result.data;

    // Normalizaciones que el servicio no hace
    orderData.shipping_info.postal_code = orderData.shipping_info.postal_code || "";
    
    // Limpieza de Items
    orderData.line_items = orderData.line_items.map(item => {
        const { variation_id, free_shipping, ...rest } = item;
        return {
            ...rest,
            variation_id: variation_id ?? null,
            free_shipping: free_shipping ?? false,
            type: "STANDARD"
        };
    });

    // 3. RESERVA DE STOCK
    // Si falla, lanzamos error y abortamos antes de crear nada
    try {
        await InventoryService.reserveStock(orderData.line_items);
    } catch (stockError) {
        return res.status(409).json({ error: stockError.message });
    }

    // 4. Persistencia Inicial en DB (PENDING)
    // Guardamos antes de llamar a la logística para tener trazabilidad
    let dbOrder = null;
    try {
        const email = orderData.billing_info.email;
        const fullName = `${orderData.billing_info.first_name} ${orderData.billing_info.last_name}`.trim();
        
        // Upsert User
        const user = await prisma.user.upsert({
            where: { email },
            update: { name: fullName },
            create: { email, name: fullName, role: 'CUSTOMER', password: 'placeholder' }
        });

        // Resolve Product IDs
        const skus = orderData.line_items.map(i => i.sku);
        const dbProducts = await prisma.product.findMany({ where: { sku: { in: skus } } });
        const dbProductMap = new Map(dbProducts.map(p => [p.sku, p]));

        // Create Order
        dbOrder = await prisma.order.create({
            data: {
                status: 'PENDING',
                paymentMethod: orderData.payment_method_code === 'COD' ? 'COD' : 'WOMPI',
                subtotal: orderData.line_items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
                shippingCost: 0, 
                total: 0,
                userId: user.id,
                customerName: fullName,
                customerEmail: email,
                customerPhone: orderData.billing_info.phone,
                customerId: orderData.billing_info.identification,
                notes: orderData.shipping_info.notes || null,
                shippingAddress: orderData.shipping_info,
                billingAddress: orderData.billing_info,
                items: {
                    create: orderData.line_items.map(item => {
                        const dbProd = dbProductMap.get(item.sku);
                        if (!dbProd) return null;
                        return {
                            product: { connect: { id: dbProd.id } },
                            sku: item.sku,
                            name: item.name,
                            price: item.unit_price,
                            quantity: item.quantity
                        };
                    }).filter(Boolean)
                }
            }
        });
        console.log(`✅ [DB] Orden creada PENDING: ${dbOrder.id}`);

    } catch (dbError) {
        console.error("❌ Linkeo DB fallido, liberando stock...", dbError);
        await InventoryService.releaseReserve(orderData.line_items);
        return res.status(500).json({ error: 'Error guardando orden en base de datos' });
    }

    // 5. Creación de Envío (Logística)
    let shipmentData = null;
    try {
        console.log("🚚 Solicitando creación de envío a LogisticsManager...");
        shipmentData = await LogisticsManager.createShipment(orderData);
    } catch (logisticsError) {
        console.error("❌ Fallo Logística:", logisticsError);
        
        // Rollback: Cancelar Orden DB y Liberar Stock
        await prisma.order.update({ where: { id: dbOrder.id }, data: { status: 'CANCELLED' } });
        await InventoryService.releaseReserve(orderData.line_items);
        
        return res.status(502).json({ 
            error: 'Error creando envío con transportadora', 
            details: logisticsError.message 
        });
    }

    // 6. Actualización Exitosa
    // Si llegamos aqui, la logística aceptó.
    try {
        const updatedOrder = await prisma.order.update({
            where: { id: dbOrder.id },
            data: {
                externalId: shipmentData.external_id,
                total: shipmentData.total || 0,
                shippingCost: shipmentData.shipping_cost || 0,
                carrier: shipmentData.carrier_name,
                trackingNumber: shipmentData.trackingNumber || null,
                // Si es COD, descontamos stock real YA.
                // Si es WOMPI, el stock se queda en "Reserved" hasta el webhook confirmación.
            }
        });

        // Caso especial COD: Confirmamos venta inmediatamente (Stock Real -)
        if (orderData.payment_method_code === 'COD') {
            await InventoryService.confirmSale(orderData.line_items);
            
            // EMAIL COD
            const mockTransaction = {
                id: `COD-${shipmentData.external_id}`, 
                status: 'PENDING_PAYMENT_ON_DELIVERY',
                payment_method: { type: 'PAGO_CONTRA_ENTREGA' }
            };
            
            // Reconstruimos objeto para el template de email (mezcla de datos originales + respuesta logística)
            const emailOrderPayload = {
                ...updatedOrder, // Datos DB
                billing_info: orderData.billing_info, // Pass original objects
                shipping_info: orderData.shipping_info,
                line_items: orderData.line_items,
                shipping_total: shipmentData.shipping_cost,
                pin: shipmentData.external_id // Venndelo ID usually
            };

            sendOrderConfirmation(emailOrderPayload, mockTransaction).catch(console.error);
        }

        return res.status(201).json({ 
            success: true, 
            order: { 
                ...shipmentData, 
                db_id: dbOrder.id,
                readable_id: dbOrder.readableId
            } 
        });

    } catch (finalError) {
        console.error("❌ Error final procesando respuesta:", finalError);
        return res.status(500).json({ error: 'Orden creada pero fallo en confirmación final' });
    }

  } catch (error) {
    console.error('ERROR INTERNO SERVIDOR:', error);
    return res.status(500).json({ error: 'Error Interno del Servidor' });
  }
}
