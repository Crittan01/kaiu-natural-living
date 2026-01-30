import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Fetch Orders from DB
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true } // Include product details
                }
            },
            take: 100 // Limit for now
        });

        // Map Prisma Order to Frontend Structure
        // Frontend expects: { items: [...] }
        const mappedOrders = orders.map(o => ({
            id: o.id,
            pin: o.readableId.toString(),
            created_at: o.createdAt,
            status: o.status,
            total: o.total,
            fulfillment_status: o.status, // Map if needed
            payment_status: o.status === 'CONFIRMED' || o.paymentMethod === 'WOMPI' ? 'PAID' : 'PENDING',
            
            shipping_info: typeof o.shippingAddress === 'string' ? JSON.parse(o.shippingAddress) : o.shippingAddress,
            billing_info: o.billingAddress ? (typeof o.billingAddress === 'string' ? JSON.parse(o.billingAddress) : o.billingAddress) : null,
            
            line_items: o.items.map(i => ({
                name: i.product.name,
                quantity: i.quantity,
                sku: i.product.sku
            })),
            
            shipments: o.trackingNumber ? [{
                carrier_name: o.carrier || 'Unknown',
                tracking_number: o.trackingNumber
            }] : []
        }));

        return res.status(200).json({ items: mappedOrders });

    } catch (error) {
        console.error("Error Admin Orders:", error);
        return res.status(500).json({ error: 'Failed to fetch orders from DB' });
    }
}
