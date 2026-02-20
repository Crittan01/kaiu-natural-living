import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Truck, Search, LayoutGrid, List as ListIcon, Printer, Loader2, RefreshCw, FileText, TrendingUp, Users, DollarSign, Activity, CheckCircle2, XCircle, Clock, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { InventoryManager } from '@/components/admin/InventoryManager';


interface Shipment {
    carrier_name: string;
    tracking_number: string;
}

interface Order {
    id: number;
    pin: string;
    customer_name?: string;
    payment_method?: string;
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
        if (error instanceof Error) {
            toast({ title: "Error Crítico", description: error.message, variant: "destructive" });
        } else {
             toast({ title: "Error", description: "Fallo desconocido cargando dashboard", variant: "destructive" });
        }
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
            const newWindow = window.open(url, '_blank');
            toast({ 
                title: "Guía Generada", 
                description: "Si no se abrió automáticamente, haz clic aquí.",
                action: <div 
                    className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive cursor-pointer border-slate-200"
                    onClick={() => window.open(url, '_blank')}
                > Abrir PDF </div>
            });
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

  const handleSyncShipments = async () => {
    try {
        toast({ title: "Sincronizando...", description: "Consultando estados en Venndelo..." });
        
        const res = await fetch('/api/admin/sync-shipments', {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            toast({ 
                title: "Sincronización Completa", 
                description: `Procesadas: ${data.processed}. Actualizadas: ${data.updated}.` 
            });
            fetchData(); 
        } else {
             throw new Error(data.error);
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : "Error desconocido";
        toast({ title: "Error Sincronizando", description: message, variant: "destructive" });
    }
  };

  /* FILTERING LOGIC */
  const [activeFilter, setActiveFilter] = useState('DETAILS');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // NEW: Payment Filter

  const getFilterPredicate = (filter: string) => {
      switch (filter) {
          case 'DETAILS': // Nuevos / Por Procesar (Generar Guía)
              return (o: Order) => ['PENDING', 'APPROVED', 'PREPARING', 'PROCESSING', 'CONFIRMED'].includes(o.status);
          case 'READY_TO_SHIP': // Listos para Recoger (Solicitar Camión)
              return (o: Order) => ['READY_TO_SHIP'].includes(o.status);
          case 'IN_TRANSIT': // Ya en manos de transportadora (o esperando que pasen)
              return (o: Order) => ['PICKUP_REQUESTED', 'SHIPPED', 'NOVEDAD', 'DISPATCHED'].includes(o.status);
          case 'DELIVERED':
              return (o: Order) => ['DELIVERED'].includes(o.status);
          case 'CANCELLED':
               return (o: Order) => ['CANCELLED', 'REJECTED', 'RETURNED'].includes(o.status);
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

  const filteredOrders = useMemo(() => {
    let result = orders.filter(getFilterPredicate(activeFilter));

    // Apply Payment Filter
    if (paymentFilter !== 'ALL') {
        result = result.filter(o => {
            if (paymentFilter === 'COD') return o.payment_method === 'COD';
            if (paymentFilter === 'ONLINE') return o.payment_method !== 'COD';
            return true;
        });
    }
    return result;
  }, [orders, activeFilter, paymentFilter]);

  const sortedOrders = [...filteredOrders].sort((a, b) => {
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
        'PREPARING': 'bg-yellow-600',
        'READY_TO_SHIP': 'bg-yellow-500',
        'PICKUP_REQUESTED': 'bg-orange-500' // New Status Color
    };
    
    // Translate standard statuses for display
    const labelMap: Record<string, string> = {
        'PENDING': 'NUEVO',
        'READY': 'ALISTADO',
        'SHIPPED': 'ENVIADO',
        'PREPARING': 'PREPARACIÓN',
        'READY_TO_SHIP': 'POR DESPACHAR',
        'PICKUP_REQUESTED': 'ESPERANDO RECOGIDA' // New Status Label
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
                    <TabsTrigger value="inventory">Inventario</TabsTrigger>
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
                             {!loading && !stats ? (
                                <div className="text-destructive">
                                    <p className="font-bold">Error cargando datos</p>
                                    <p className="text-sm">Verifica la conexión API o intenta recargar.</p>
                                </div>
                             ) : (
                                <>
                                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                                    <p>Cargando Estadísticas...</p>
                                </>
                             )}
                        </div>
                    )}
                </TabsContent>
                
                {/* --- TAB: INVENTORY (NEW) --- */}
                <TabsContent value="inventory" className="space-y-4">
                   <InventoryManager token={token} />
                </TabsContent>

                {/* --- TAB: SHIPMENTS (NEW LAYOUT) --- */}
                <TabsContent value="shipments" className="space-y-4">
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        
                        {/* LEFT SIDEBAR - LIFECYCLE STATUS */}
                        <div className="w-full md:w-64 flex flex-col gap-2">
                             <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Estado del Pedido</h3>
                             {['DETAILS', 'READY_TO_SHIP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'ALL'].map((filterKey) => {
                                const info: Record<string, { label: string, icon: React.ElementType }> = {
                                    'ALL': { label: 'Todos', icon: ListIcon },
                                    'DETAILS': { label: 'Por Procesar', icon: Clock },
                                    'READY_TO_SHIP': { label: 'Por Recoger', icon: Package },
                                    'IN_TRANSIT': { label: 'En Tránsito', icon: Truck },
                                    'DELIVERED': { label: 'Entregados', icon: CheckCircle2 },
                                    'CANCELLED': { label: 'Cancelados', icon: XCircle }
                                };
                                const itemsCount = orders.filter(o => {
                                    // 1. Matches Status?
                                    if (!getFilterPredicate(filterKey)(o)) return false;
                                    
                                    // 2. Matches Payment Filter?
                                    if (paymentFilter === 'COD') return o.payment_method === 'COD';
                                    if (paymentFilter === 'ONLINE') return o.payment_method !== 'COD';
                                    
                                    return true;
                                }).length;
                                const Icon = info[filterKey].icon;

                                return (
                                    <Button
                                        key={filterKey}
                                        variant={activeFilter === filterKey ? "secondary" : "ghost"}
                                        className={`justify-start h-10 px-3 ${activeFilter === filterKey ? "font-semibold bg-secondary" : ""}`}
                                        onClick={() => setActiveFilter(filterKey)}
                                    >
                                        <Icon className="w-4 h-4 mr-2" />
                                        {info[filterKey].label}
                                        <span className="ml-auto text-xs text-muted-foreground bg-muted-foreground/10 px-2 py-0.5 rounded-full">
                                            {itemsCount}
                                        </span>
                                    </Button>
                                )
                             })}
                        </div>

                        {/* RIGHT CONTENT - FILTERS & TABLE */}
                        <div className="flex-1 space-y-4">
                             
                             {/* TOP BAR: PAYMENT & SYNC */}
                             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border">
                                
                                {/* PAYMENT FILTER */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground mr-2">Filtro de Pago:</span>
                                    <div className="flex gap-1 p-1 bg-muted rounded-md">
                                        {['ALL', 'COD', 'ONLINE'].map((pFilter) => {
                                            const pLabels: Record<string, string> = { 'ALL': 'Todos', 'COD': 'Contra Entrega', 'ONLINE': 'Pagado' };
                                            return (
                                                <Button
                                                    key={pFilter}
                                                    variant={paymentFilter === pFilter ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setPaymentFilter(pFilter)}
                                                    className="h-7 text-xs px-3"
                                                >
                                                {pLabels[pFilter]}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* SYNC BUTTON */}
                                <Button variant="outline" size="sm" onClick={handleSyncShipments} className="gap-2">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Sincronizar
                                </Button>
                             </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Listado de Órdenes</CardTitle>
                            <CardDescription>Genera guías, solicita recogidas y monitorea el estado.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <Table className="min-w-[1000px]">
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
                                        <TableHead>Rastreo</TableHead>
                                        {/* Status Column Removed as per UI Refinement */}
                                        <TableHead>Pago</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={showFinancials ? 7 : 6} className="text-center py-10">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : visibleOrders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={showFinancials ? 7 : 6} className="text-center py-10 text-muted-foreground">
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
                                                            {order.customer_name || (() => {
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
                                                {/* Status Column Removed */}
                                                <TableCell>
                                                    <Badge variant="outline" className={order.payment_method === 'COD' ? 'border-primary text-primary' : 'border-blue-500 text-blue-500'}>
                                                        {order.payment_method === 'COD' ? 'Contra Entrega' : 'Online'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">

                                                    <div className="flex justify-end gap-2">
                                                        {/* ACTION BUTTONS BASED ON STATUS */}
                                                        {/* Print Label: Available for Pending/Processing (Generate) AND Ready/Pickup/Shipped (Reprint) */}
                                                        {['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_TO_SHIP', 'PICKUP_REQUESTED', 'SHIPPED'].includes(order.status) && (
                                                            <Button 
                                                                size="sm" 
                                                                variant={['SHIPPED', 'READY_TO_SHIP', 'PICKUP_REQUESTED'].includes(order.status) ? "outline" : "default"}
                                                                onClick={() => handleGenerateLabel(String(order.id))} 
                                                                disabled={generatingLabel === String(order.id)}
                                                                className="h-8 px-2"
                                                                title={['SHIPPED', 'READY_TO_SHIP', 'PICKUP_REQUESTED'].includes(order.status) ? "Reimprimir Guía" : "Generar Guía"}
                                                            >
                                                                {String(generatingLabel) === String(order.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <Printer className="h-3 w-3" />}
                                                            </Button>
                                                        )}

                                                        {order.status === 'READY_TO_SHIP' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="default"
                                                                onClick={() => handleRequestPickup(String(order.id))}
                                                                className="h-8 px-2 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
                                                                title="Solicitar Recogida a Transportadora"
                                                            >
                                                                <Truck className="mr-2 h-3 w-3" />
                                                                Solicitar Recogida
                                                            </Button>
                                                        )}
                                                        
                                                        {/* Status Badge for PICKUP_REQUESTED (since it doesn't have a specific button action) */}
                                                        {order.status === 'PICKUP_REQUESTED' && (
                                                            <Badge variant="outline" className="h-8 border-orange-300 text-orange-600 bg-orange-50">
                                                                Esperando Recogida
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                        </div> {/* End Right Content */}
                    </div> {/* End Flex Layout */}
                </TabsContent>
            </Tabs>
        </main>
    </div>
  );
}
