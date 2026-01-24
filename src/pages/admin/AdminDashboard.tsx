import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout'; // Using Layout for structure, maybe simplify later
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { FileText, Loader2, RefreshCw, Printer, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    shipments: any[];
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLabel, setGeneratingLabel] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = sessionStorage.getItem('kaiu_admin_token');

  const fetchOrders = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
            navigate('/admin/login');
            return;
        }
        if (!res.ok) throw new Error('Error cargando órdenes');
        const data = await res.json();
        const ordersList = data.items || data.results || []; // Fallback to be safe
        setOrders(ordersList);
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudieron cargar las órdenes", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
        navigate('/admin/login');
        return;
    }
    fetchOrders();
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
                 variant: "default" // Blue/Info
             });
             return;
        }

        // Check format. Documentation says it returns URL or Base64.
        const url = data.data; // ApiGenerateLabelsOut -> data
        if (url && typeof url === 'string' && url.length > 10) {
            window.open(url, '_blank');
            toast({ title: "Guía Generada", description: "Se ha abierto en una nueva pestaña" });
            fetchOrders(); // Unlock Pickup button by refreshing data
        } else {
            // It might be a persistent failure that returned 200/201 but with error data? 
            // Or our backend might have returned 400.
            // If backend returned 400, it throws Error above. 
            // If we are here, backend returned 200 but data is not URL.
            console.log("Respuesta desconocida:", data);
            toast({ 
                title: "Error de Formato", 
                description: `Respuesta inesperada: ${JSON.stringify(data).substring(0, 100)}`, 
                variant: "destructive" 
            });
        }

    } catch (error: any) {
        // Handle 400 errors from backend
        // If it throws Error(message), we show it.
        // If fetch failed, we show it.
        const msg = error.message || "Error desconocido";
        toast({ title: "Error Generando Guía", description: msg, variant: "destructive" });
    } finally {
        setGeneratingLabel(null);
    }
  };

  const handleConfirmation = async (orderId: string, action: 'CONFIRMED' | 'REJECTED') => {
      try {
        const res = await fetch('/api/admin/confirm-order', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ orderId, action })
        });

        if (!res.ok) throw new Error('Error actualizando estado');
        
        toast({ title: "Éxito", description: `Orden ${action === 'CONFIRMED' ? 'Aprobada' : 'Rechazada'} correctamente` });
        fetchOrders(); // Refresh

      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" });
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
    } catch (error: any) {
        toast({ title: "Error", description: error.message || "Fallo en solicitud", variant: "destructive" });
    }
  };

  const visibleOrders = orders.filter(o => !['CANCELLED', 'REJECTED', 'RETURNED', 'INCIDENT'].includes(o.status));

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
        'PENDING': 'bg-yellow-500', 
        'APPROVED': 'bg-green-500',
        'READY': 'bg-blue-600', // Ready for pickup / Alistado
        'SHIPPED': 'bg-indigo-500',
        'DELIVERED': 'bg-green-700',
        'CANCELLED': 'bg-red-500',
        'CONFIRMED': 'bg-green-500',
        'REJECTED': 'bg-red-500'
    };
    
    // Translate standard statuses for display
    const labelMap: Record<string, string> = {
        'PENDING': 'NUEVO',
        'READY': 'ALISTADO',
        'SHIPPED': 'ENVIADO',
    };

    return <Badge className={`${map[status] || 'bg-gray-500'} text-white`}>{labelMap[status] || status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
        <header className="border-b px-6 py-4 flex justify-between items-center bg-card">
            <h1 className="text-xl font-bold font-display">KAIU Admin</h1>
            <Button variant="outline" size="sm" onClick={() => {
                sessionStorage.removeItem('kaiu_admin_token');
                navigate('/admin/login');
            }}>Cerrar Sesión</Button>
        </header>
        
        <main className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Órdenes Recientes</h2>
                <Button onClick={fetchOrders} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : visibleOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No hay órdenes pendientes de procesar.
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
                                                    {order.shipping_info?.first_name} {order.shipping_info?.last_name}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate" title={order.shipping_info?.address_1}>
                                                    {order.shipping_info?.address_1 || order.shipping_info?.city || 'Dirección no disponible'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell>${Number(order.total).toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Pickup only allowed for PENDING (Nuevo) orders with Shipment Loop created */}
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className={`h-8 w-8 p-0 ${['READY', 'SHIPPED', 'DELIVERED'].includes(order.status) ? 'opacity-50' : ''}`}
                                                    onClick={() => handleRequestPickup(String(order.id))}
                                                    disabled={!['PENDING', 'PREPARING'].includes(order.status) || !order.shipments || order.shipments.length === 0} 
                                                    title={
                                                        !order.shipments || order.shipments.length === 0 ? "Primero genera la Guía para habilitar recogida" :
                                                        ['PENDING', 'PREPARING'].includes(order.status) ? "Solicitar Recogida" : "Recogida ya solicitada"
                                                    }
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
        </main>
    </div>
  );
}
