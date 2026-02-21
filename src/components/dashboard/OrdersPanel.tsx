import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Package, Truck, List as ListIcon, Printer, Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken { role: string; email: string; }

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

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLabel, setGeneratingLabel] = useState<string | null>(null);
  const { toast } = useToast();

  const token = sessionStorage.getItem('kaiu_admin_token');
  
  // ROLE DETECTION
  let userRole = 'SUPPORT';
  if (token) {
     try { userRole = jwtDecode<DecodedToken>(token).role; } catch (e) { console.error('Token Decode Error'); }
  }
  const showFinancials = userRole === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
        const res = await fetch('/api/admin/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error cargando lista de órdenes');
        const ordersData = await res.json();
        setOrders(ordersData.items || ordersData.results || []);

    } catch (error) {
        if (error instanceof Error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateStatus = (code: string) => {
    const STATUS_MAP: Record<string, { label: string, color: string }> = {
        'PENDING': { label: 'Revisión Pend.', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
        'CONFIRMED': { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        'PREPARING': { label: 'Empacando', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        'PROCESSING': { label: 'En Proceso', color: 'bg-indigo-100 text-indigo-800' },
        'READY_TO_SHIP': { label: 'Guía Lista', color: 'bg-teal-100 text-teal-800 border-teal-200' },
        'PICKUP_REQUESTED': { label: 'Recogida Solicitada', color: 'bg-orange-100 text-orange-800' },
        'DISPATCHED': { label: 'Despachado', color: 'bg-orange-100 text-orange-800' },
        'SHIPPED': { label: 'En Tránsito', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        'NOVEDAD': { label: 'Novedad/Incidencia', color: 'bg-red-100 text-red-800 border-red-200 animate-pulse' },
        'DELIVERED': { label: 'Entregado', color: 'bg-green-100 text-green-800 border-green-200' },
        'CANCELLED': { label: 'Cancelado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
        'REJECTED': { label: 'Rechazado Wompi', color: 'bg-red-100 text-red-800' }
    };
    return STATUS_MAP[code] || { label: code, color: 'bg-gray-100 text-gray-800' };
  };

  const handleGenerateLabel = async (orderId: string) => {
    setGeneratingLabel(orderId);
    try {
        const res = await fetch('/api/admin/generate-label', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ orderId })
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } 
        catch (_) { throw new Error(`El servidor de guías de Venndelo respondió con error: ${text.substring(0, 100)}...`); }

        if (!res.ok) throw new Error(data.error || 'Fallo genérico');

        toast({ title: "Guía Generada", description: `Orden ${orderId} lista para despacho.` });
        if (data.trackingUrl) window.open(data.trackingUrl, '_blank');
        fetchData();

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
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ orderIds: [orderId] })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error solicitando recogida');
        toast({ title: "Recogida Solicitada", description: "La transportadora ha sido notificada." });
        fetchData();
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
            toast({ title: "Sincronización Completa", description: `Procesadas: ${data.processed}. Actualizadas: ${data.updated}.` });
            fetchData(); 
        } else {
             throw new Error(data.error);
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : "Error desconocido";
        toast({ title: "Error Sincronizando", description: message, variant: "destructive" });
    }
  };

  const [activeFilter, setActiveFilter] = useState('DETAILS');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  const getFilterPredicate = (filter: string) => {
      switch (filter) {
          case 'DETAILS': return (o: Order) => ['PENDING', 'APPROVED', 'PREPARING', 'PROCESSING', 'CONFIRMED'].includes(o.status);
          case 'READY_TO_SHIP': return (o: Order) => ['READY_TO_SHIP'].includes(o.status);
          case 'IN_TRANSIT': return (o: Order) => ['PICKUP_REQUESTED', 'SHIPPED', 'NOVEDAD', 'DISPATCHED'].includes(o.status);
          case 'DELIVERED': return (o: Order) => ['DELIVERED'].includes(o.status);
          case 'CANCELLED': return (o: Order) => ['CANCELLED', 'REJECTED', 'RETURNED'].includes(o.status);
          case 'ALL': default: return (o: Order) => true;
      }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(getFilterPredicate(activeFilter));
    if (paymentFilter !== 'ALL') {
        result = result.filter(o => {
            if (paymentFilter === 'COD') return o.payment_method === 'COD';
            if (paymentFilter === 'ONLINE') return o.payment_method !== 'COD';
            return true;
        });
    }
    return result;
  }, [orders, activeFilter, paymentFilter]);

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      <div>
         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Centro de Despachos</h2>
         <p className="text-sm text-muted-foreground">Gestiona las órdenes, genera guías y automatiza la logística</p>
      </div>

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
                      if (!getFilterPredicate(filterKey)(o)) return false;
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
                          <TableHead className="w-[80px]">PIN</TableHead>
                          <TableHead className="w-[100px]">Fecha</TableHead>
                          <TableHead className="w-[200px]">Cliente</TableHead>
                          <TableHead className="w-[250px]">Productos</TableHead>
                          {showFinancials && <TableHead className="w-[100px]">Total</TableHead>}
                          <TableHead>Rastreo</TableHead>
                          <TableHead>Pago</TableHead>
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
                      ) : filteredOrders.length === 0 ? (
                          <TableRow>
                              <TableCell colSpan={showFinancials ? 8 : 7} className="text-center py-10 text-muted-foreground">
                                  No hay órdenes en esta categoría.
                              </TableCell>
                          </TableRow>
                      ) : (
                          filteredOrders.map((order: Order) => (
                              <TableRow key={order.id}>
                                  <TableCell className="font-mono font-medium text-xs">
                                      #{order.pin}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                      {new Date(order.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                      <div className="font-medium text-sm truncate max-w-[150px]" title={order.customer_name || (order.billing_info?.first_name + ' ' + order.billing_info?.last_name)}>
                                           {order.customer_name || `${order.billing_info?.first_name || ''} ${order.billing_info?.last_name || ''}`.trim() || 'Cliente'}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                          {order.shipping_info?.city}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <div className="flex flex-col gap-1 max-w-[250px]">
                                          {order.line_items?.map((item, idx) => (
                                              <div key={idx} className="text-xs flex justify-between gap-2 border-b border-border/50 pb-1 last:border-0 last:pb-0">
                                                  <span className="truncate flex-1" title={item.name}>{item.name}</span>
                                                  <span className="text-muted-foreground font-mono bg-muted px-1 rounded">x{item.quantity}</span>
                                              </div>
                                          ))}
                                          {(!order.line_items || order.line_items.length === 0) && <span className="text-xs text-muted-foreground italic">-</span>}
                                      </div>
                                  </TableCell>
                                  {showFinancials && (
                                     <TableCell className="font-medium text-xs">
                                         ${order.total?.toLocaleString() || '0'}
                                     </TableCell>
                                  )}
                                  <TableCell>
                                       <div className="flex flex-col gap-1">
                                          <Badge variant="outline" className={`w-fit ${translateStatus(order.status).color}`}>
                                              {translateStatus(order.status).label}
                                          </Badge>
                                          {order.shipments && order.shipments.length > 0 && (
                                              <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                                  <Truck className="w-3 h-3"/>
                                                  {order.shipments[0].tracking_number}
                                              </div>
                                          )}
                                      </div>
                                  </TableCell>
                                  <TableCell>
                                      <Badge variant={order.payment_method === 'COD' ? 'secondary' : 'default'} className="text-[10px]">
                                          {order.payment_method === 'COD' ? 'Paga en Casa' : 'Wompi'}
                                      </Badge>
                                      {order.payment_method !== 'COD' && (
                                          <div className={`text-[10px] mt-1 font-medium ${order.payment_status === 'APPROVED' ? 'text-green-600' : 'text-red-500'}`}>
                                              {order.payment_status === 'APPROVED' ? '✓ Pagado' : order.payment_status}
                                          </div>
                                      )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      {/* Only show 'Generar Guia' if it's new / pending dispatch */}
                                      {['PENDING', 'CONFIRMED', 'PROCESSING', 'PREPARING'].includes(order.status) ? (
                                           <Button 
                                             size="sm" 
                                             onClick={() => handleGenerateLabel(order.id.toString())}
                                             disabled={generatingLabel === order.id.toString()}
                                             className="h-7 text-xs w-full sm:w-auto"
                                           >
                                              {generatingLabel === order.id.toString() ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin"/> : <Printer className="w-3.5 h-3.5 mr-1" />}
                                              Generar Guía
                                          </Button>
                                      ) : order.status === 'READY_TO_SHIP' ? (
                                          <Button 
                                             size="sm" 
                                             variant="secondary"
                                             onClick={() => handleRequestPickup(order.id.toString())}
                                             className="h-7 text-xs w-full sm:w-auto"
                                           >
                                              <Truck className="w-3.5 h-3.5 mr-1" />
                                              Pedir Camión
                                          </Button>
                                      ) : (
                                          // Other Statuses (In transit, delivered)
                                          <Button size="sm" variant="outline" className="h-7 text-xs w-full sm:w-auto" asChild>
                                              <a href={`/rastreo?pin=${order.pin}`} target="_blank" rel="noreferrer">
                                                  Ver Rastreo
                                              </a>
                                          </Button>
                                      )}
                                  </TableCell>
                              </TableRow>
                          ))
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
          </div>
      </div>
    </div>
  );
}
