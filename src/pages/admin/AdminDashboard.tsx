import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, RefreshCw, Printer, Truck, TrendingUp, Users, Package, DollarSign, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Shipment {
    carrier_name: string;
    tracking_number: string;
}

interface Order {
    id: number;
    pin: string;
    created_at: string;
    status: string;
    total: number;
    fulfillment_status: string;
    shipping_info: { first_name: string; last_name: string; email: string; phone: string; address_1: string; city: string };
    billing_info: { first_name: string; last_name: string; email: string };
    payment_status: string;
    shipments: Shipment[];
    line_items: { name: string; quantity: number; sku: string }[];
}

interface DashboardStats {
    kpi: {
        totalSales: number;
        totalOrders: number;
        pendingOrders: number;
        averageTicket: number;
    };
    charts: {
        sales: { date: string; total: number }[];
        status: { name: string; value: number }[];
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLabel, setGeneratingLabel] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = sessionStorage.getItem('kaiu_admin_token');

  const fetchData = async () => {
    setLoading(true);
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Parallel Fetch: Stats and Orders
        const [ordersRes, statsRes] = await Promise.all([
            fetch('/api/admin/orders', { headers }),
            fetch('/api/admin/dashboard-stats', { headers })
        ]);

        if (ordersRes.status === 401 || statsRes.status === 401) {
            navigate('/admin/login');
            return;
        }

        if (!ordersRes.ok) throw new Error('Error cargando lista de órdenes');
        const ordersData = await ordersRes.json();
        setOrders(ordersData.items || ordersData.results || []);

        if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
        }

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudieron cargar los datos del dashboard", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
        navigate('/admin/login');
        return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate]);

  const handleGenerateLabel = async (orderId: string) => {
    if (!confirm('¿Generar/Imprimir Guía para esta orden?')) return;
    setGeneratingLabel(orderId);
    try {
        const res = await fetch('/api/admin/generate-label', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderIds: [orderId] })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Fallo generando guía');

        if (res.status === 202 || data.status === 'PROCESSING') {
             toast({ 
                 title: "Creando Guía...", 
                 description: data.message || "La transportadora está procesando. Reintenta en unos segundos.",
                 variant: "default" 
             });
             return;
        }

        const url = data.data; 
        if (url && typeof url === 'string' && url.length > 10) {
            window.open(url, '_blank');
            toast({ title: "Guía Generada", description: "Se ha abierto en una nueva pestaña" });
            fetchData(); 
        } else {

            toast({ 
                title: "Error de Formato", 
                description: `Respuesta inesperada: ${JSON.stringify(data).substring(0, 100)}`, 
                variant: "destructive" 
            });
        }

    } catch (error) {
        let msg = "Error desconocido";
        if (error instanceof Error) msg = error.message;
        toast({ title: "Error Generando Guía", description: msg, variant: "destructive" });
    } finally {
        setGeneratingLabel(null);
    }
  };

  const handleRequestPickup = async (orderId: string) => {
    if (!confirm('¿Solicitar recogida para esta orden?')) return;
    try {
        const res = await fetch('/api/admin/request-pickup', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderIds: [orderId] })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error solicitando recogida');
        toast({ title: "Recogida Solicitada", description: "La transportadora ha sido notificada." });
    } catch (error) {
        let msg = "Fallo en solicitud";
        if (error instanceof Error) msg = error.message;
        toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const [activeFilter, setActiveFilter] = useState('ACTION_REQUIRED'); // Default to action items

  const getFilterPredicate = (filter: string) => {
      switch (filter) {
          case 'ACTION_REQUIRED':
              return (o: Order) => ['PENDING', 'APPROVED', 'PREPARING', 'CONFIRMED'].includes(o.status);
          case 'IN_TRANSIT':
              return (o: Order) => ['SHIPPED', 'READY', 'NOVEDAD'].includes(o.status);
          case 'COMPLETED':
              return (o: Order) => ['DELIVERED', 'CANCELLED', 'REJECTED', 'RETURNED'].includes(o.status);
          case 'ALL':
          default:
              return (o: Order) => true; // Show everything
      }
  };

  // Sorting Logic
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = [...orders.filter(getFilterPredicate(activeFilter))].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue = a[sortConfig.key as keyof Order];
    let bValue = b[sortConfig.key as keyof Order];

    // Special handlers for nested properties
    if (sortConfig.key === 'client') {
        aValue = `${a.shipping_info?.first_name || ''} ${a.shipping_info?.last_name || ''}`;
        bValue = `${b.shipping_info?.first_name || ''} ${b.shipping_info?.last_name || ''}`;
    } else if (sortConfig.key === 'products') {
        aValue = a.line_items?.length || 0;
        bValue = b.line_items?.length || 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const visibleOrders = sortedOrders;

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
        'PENDING': 'bg-yellow-500', 
        'APPROVED': 'bg-green-500',
        'READY': 'bg-blue-600', 
        'SHIPPED': 'bg-indigo-500',
        'DELIVERED': 'bg-green-700',
        'CANCELLED': 'bg-red-500',
        'CONFIRMED': 'bg-green-500',
        'REJECTED': 'bg-red-500',
        'PREPARING': 'bg-yellow-600'
    };
    
    // Translate standard statuses for display
    const labelMap: Record<string, string> = {
        'PENDING': 'NUEVO',
        'READY': 'ALISTADO',
        'SHIPPED': 'ENVIADO',
        'PREPARING': 'PREPARACIÓN'
    };

    return <Badge className={`${map[status] || 'bg-gray-500'} text-white`}>{labelMap[status] || status}</Badge>;
  };

  const currentUser = sessionStorage.getItem('kaiu_admin_user') || 'kaiu';
  const showFinancials = currentUser.toLowerCase() === 'kaiu';

  return (
    <div className="min-h-screen bg-background pb-20">
        <header className="border-b px-6 py-4 flex justify-between items-center bg-card sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold font-display">KAIU Operations</h1>
                <Badge variant="outline" className="font-mono text-xs">{currentUser}</Badge>
            </div>
            <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => {
                    sessionStorage.removeItem('kaiu_admin_token');
                    navigate('/admin/login');
                }}>Salir</Button>
            </div>
        </header>
        
        <main className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6">Panel de Control</h2>
            
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Resumen Ejecutivo</TabsTrigger>
                    <TabsTrigger value="shipments">Gestión de Envíos</TabsTrigger>
                </TabsList>

                {/* --- TAB: OVERVIEW (KPIS + CHARTS) --- */}
                <TabsContent value="overview" className="space-y-4">
                    {stats && showFinancials ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ventas Totales (Mes)</CardTitle>
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${stats.kpi.totalSales.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">+20.1% vs mes anterior (mock)</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">${Math.round(stats.kpi.averageTicket).toLocaleString()}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Órdenes Activas</CardTitle>
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.kpi.pendingOrders}</div>
                                        <p className="text-xs text-muted-foreground">Pendientes de despacho</p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{stats.kpi.totalOrders}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                                <Card className="md:col-span-4">
                                    <CardHeader>
                                        <CardTitle>Comportamiento de Ventas</CardTitle>
                                        <CardDescription>Visualización diaria de los últimos 30 días</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pl-2">
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.charts.sales}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit'})}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        height={50}
                                                    />
                                                    <YAxis 
                                                        tickFormatter={(val) => `$${(val/1000)}k`} 
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <Tooltip 
                                                        formatter={(val: number) => [`$${val.toLocaleString()}`, 'Ventas']}
                                                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Bar dataKey="total" fill="#4F6D7A" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-3">
                                    <CardHeader>
                                        <CardTitle>Estado de Pedidos</CardTitle>
                                        <CardDescription>Distribución actual</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.charts.status}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {stats.charts.status.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : (
                        <div className="p-10 text-center text-muted-foreground border border-dashed rounded-lg">
                             <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                             <p>Cargando Estadísticas...</p>
                        </div>
                    )}
                </TabsContent>

                {/* --- TAB: SHIPMENTS (TABLE) --- */}
                <TabsContent value="shipments" className="space-y-4">
                    
                    {/* FILTER BAR */}
                    <div className="flex gap-2 pb-2 overflow-x-auto">
                        {['ALL', 'ACTION_REQUIRED', 'IN_TRANSIT', 'COMPLETED'].map((filterKey) => {
                            const labels: Record<string, string> = {
                                'ALL': 'Todos',
                                'ACTION_REQUIRED': 'Por Despachar',
                                'IN_TRANSIT': 'En Tránsito',
                                'COMPLETED': 'Histórico'
                            };
                            
                            // Calculate count for this filter
                            const count = orders.filter(o => getFilterPredicate(filterKey)(o)).length;

                            return (
                                <Button
                                    key={filterKey}
                                    variant={activeFilter === filterKey ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveFilter(filterKey)}
                                    className="rounded-full text-xs"
                                >
                                    {labels[filterKey]} 
                                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 bg-white/20 text-current">{count}</Badge>
                                </Button>
                            );
                        })}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Órdenes</CardTitle>
                            <CardDescription>Genera guías, solicita recogidas y monitorea el estado.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('pin')}>
                                            PIN {sortConfig?.key === 'pin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('created_at')}>
                                            Fecha {sortConfig?.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('client')}>
                                            Cliente {sortConfig?.key === 'client' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="w-[250px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('products')}>
                                            Productos {sortConfig?.key === 'products' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        {showFinancials && (
                                            <TableHead className="w-[100px] cursor-pointer hover:bg-muted/50" onClick={() => handleSort('total')}>
                                                Total {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                            </TableHead>
                                        )}
                                        <TableHead>Guía / Estado</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                                            Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                        </TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={showFinancials ? 8 : 7} className="text-center py-10">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : visibleOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={showFinancials ? 8 : 7} className="text-center py-10 text-muted-foreground">
                                                No hay órdenes en esta categoría.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        visibleOrders.map((order: Order) => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-bold text-sm">#{order.pin || order.id}</TableCell>
                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col max-w-[200px]">
                                                        <span className="font-medium truncate" title={`${order.shipping_info?.first_name} ${order.shipping_info?.last_name}`}>
                                                            {(() => {
                                                                const info = order.shipping_info || order.billing_info;
                                                                if (!info) return 'Sin Nombre';
                                                                const first = (info.first_name || '').trim();
                                                                const last = (info.last_name || '').trim();
                                                                if (first.toLowerCase() === last.toLowerCase()) return first;
                                                                if (first.toLowerCase().includes(last.toLowerCase())) return first;
                                                                return `${first} ${last}`;
                                                            })()}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate" title={order.shipping_info?.address_1}>
                                                            {order.shipping_info?.address_1 || order.shipping_info?.city || 'Dirección no disponible'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        {order.line_items?.map((item, idx) => (
                                                            <span key={idx} className="truncate max-w-[250px]" title={item.name}>
                                                                {item.quantity}x {item.name}
                                                            </span>
                                                        ))}
                                                        {(!order.line_items || order.line_items.length === 0) && <span className="text-muted-foreground">-</span>}
                                                    </div>
                                                </TableCell>
                                                {showFinancials && (
                                                    <TableCell className="font-medium">
                                                        ${Number(order.total).toLocaleString()}
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <div className="flex flex-col text-xs">
                                                        {order.shipments && order.shipments.length > 0 ? (
                                                            <>
                                                                <span className="font-bold">{order.shipments[0].carrier_name}</span>
                                                                <span className="font-mono text-blue-600 cursor-pointer hover:underline" onClick={() => window.open(`https://kaiu.com.co/rastreo?guide=${order.shipments[0].tracking_number}`, '_blank')}>
                                                                    {order.shipments[0].tracking_number}
                                                                </span>
                                                            </>
                                                        ) : <span className="text-muted-foreground text-xs">Pendiente de Guía</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(order.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className={`h-8 w-8 p-0 ${['READY', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'opacity-50' : ''}`}
                                                            onClick={() => handleRequestPickup(String(order.id))}
                                                            disabled={!['PENDING', 'PREPARING'].includes(order.status) || !order.shipments || order.shipments.length === 0} 
                                                            title="Solicitar Recogida"
                                                        >
                                                            <Truck className={`w-4 h-4 ${['READY', 'SHIPPED'].includes(order.status) ? 'text-green-600' : ''}`} />
                                                        </Button>

                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8"
                                                            onClick={() => handleGenerateLabel(String(order.id))}
                                                            disabled={generatingLabel === String(order.id) || order.status === 'CANCELLED' || order.status === 'REJECTED' || order.status === 'INCIDENT'}
                                                            title="Generar/Imprimir Guía"
                                                        >
                                                            {String(generatingLabel) === String(order.id) ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Printer className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
