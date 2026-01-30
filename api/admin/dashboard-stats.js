
import fetch from 'node-fetch';
import { verifyAdminToken } from './auth-helper.js';

export default async function dashboardStatsHandler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!verifyAdminToken(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const VENNDELO_API_KEY = process.env.VENNDELO_API_KEY;

    try {
        // 1. Fetch Orders (Limit 100 for V1 Stats - avoiding pagination complexity for now)
        // ideally we would loop through pages, but for V1 let's get recent snapshot
        const response = await fetch('https://api.venndelo.com/v1/admin/orders?limit=100', {
            headers: { 'X-Venndelo-Api-Key': VENNDELO_API_KEY }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch orders from Venndelo');
        }

        const data = await response.json();
        const orders = data.items || data.results || [];

        // 2. Calculate KPIs
        const totalOrders = orders.length; // In this batch
        
        // Filter Valid Orders (Not Cancelled/Rejected)
        const validOrders = orders.filter(o => !['CANCELLED', 'REJECTED', 'VOIDED', 'ERROR'].includes(o.status));
        const activeOrders = validOrders.filter(o => ['PENDING', 'APPROVED', 'READY', 'PREPARING'].includes(o.status));
        
        // Total Sales (Sum of totals of valid orders)
        // Be careful with string/number types from API
        const totalSales = validOrders.reduce((sum, order) => {
            return sum + (parseFloat(order.total) || 0);
        }, 0);

        const averageTicket = validOrders.length > 0 ? (totalSales / validOrders.length) : 0;

        // 3. Prepare Chart Data: Sales Last 30 Days (Group by Date)
        // Map date -> sum
        const salesByDate = {};
        orders.forEach(order => {
             if (['CANCELLED', 'REJECTED'].includes(order.status)) return;
             
             // Extract YYYY-MM-DD
             const date = new Date(order.created_at).toISOString().split('T')[0];
             salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(order.total) || 0);
        });

        // Convert to Array for Recharts [{ date: '2023-01-01', total: 50000 }]
        // Sort by date asc
        const salesChartData = Object.keys(salesByDate)
            .sort()
            .slice(-30) // Last 30 days present
            .map(date => ({
                date,
                total: salesByDate[date]
            }));

        // 4. Prepare Chart Data: Order Status Distribution
        const statusCounts = {};
        orders.forEach(order => {
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
                totalOrders: validOrders.length,
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
