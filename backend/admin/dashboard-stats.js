import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';

export default async function dashboardStatsHandler(req, res) {
    console.log("📊 Dashboard Stats Handler Hit");
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // 1. Fetch Orders directly from DB (Last 30 days for charts, or all for KPIs)
        // For simplicity in V1: Fetch all valid orders to calculate totals accurately.
        // Optimization: In V2 use aggregate queries.
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            // Optional: select specific fields to reduce payload
            select: {
                id: true,
                readableId: true,
                status: true,
                total: true,
                createdAt: true
            }
        });

        // 2. Calculate KPIs
        const totalOrders = orders.length;
        
        // Filter Valid Orders (Not Cancelled/Returned for financial stats)
        const validOrders = orders.filter(o => !['CANCELLED', 'RETURNED', 'REJECTED'].includes(o.status));
        const activeOrders = validOrders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP'].includes(o.status));
        
        const totalSales = validOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        const averageTicket = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;

        // 3. Prepare Chart Data: Sales Last 30 Days
        const salesByDate = {};
        validOrders.forEach(order => {
             const date = new Date(order.createdAt).toISOString().split('T')[0];
             salesByDate[date] = (salesByDate[date] || 0) + (order.total || 0);
        });

        // Fill in missing days or just show active days? Let's show active days sorted.
        // Slice to last 30 entries
        const salesChartData = Object.keys(salesByDate)
            .sort()
            .slice(-30) 
            .map(date => ({
                date,
                total: salesByDate[date]
            }));

        // 4. Prepare Chart Data: Order Status Distribution
        const statusCounts = {};
        orders.forEach(order => {
            // Map english status to simpler display if needed, or keep as is.
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
        });
        
        const statusChartData = Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
        }));


        // 5. Return Stats
        res.json({
            kpi: {
                totalSales,
                totalOrders, // All orders including cancelled
                pendingOrders: activeOrders.length,
                averageTicket
            },
            charts: {
                sales: salesChartData,
                status: statusChartData
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
