import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TrackResult {
  id: string;
  status: string;
  fulfillment_status?: string;
  created_at: string;
  tracking_url?: string;
  total: number;
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/track-order?id=${orderId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No pudimos encontrar tu orden.');
      }

      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
      switch(status?.toUpperCase()) {
          case 'SENT': return 'bg-blue-500';
          case 'DELIVERED': return 'bg-green-500';
          case 'CANCELLED': return 'bg-red-500';
          default: return 'bg-yellow-500'; // Pending, Processing
      }
  };

  const translateStatus = (status: string) => {
      const map: Record<string, string> = {
          'PENDING': 'Pendiente',
          'APPROVED': 'Aprobado',
          'SENT': 'Enviado',
          'DELIVERED': 'Entregado',
          'CANCELLED': 'Cancelado',
          'RETURNED': 'Devuelto'
      };
      return map[status?.toUpperCase()] || status;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-2xl min-h-[60vh]">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-4">Rastrea tu Pedido</h1>
          <p className="text-muted-foreground">Ingresa el ID de tu orden para ver el estado actual.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda de Envíos</CardTitle>
            <CardDescription>El ID de orden te fue enviado al correo al confirmar la compra.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <Input 
                placeholder="Ej: 12345" 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span className="ml-2 hidden sm:inline">Buscar</span>
              </Button>
            </form>

            {error && (
                <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className="border rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">Orden #{result.id}</h3>
                            <p className="text-sm text-muted-foreground">Fecha: {new Date(result.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={`${getStatusColor(result.fulfillment_status || result.status)} text-white`}>
                            {translateStatus(result.fulfillment_status || result.status)}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                                <Package className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Estado del Pago</p>
                                <p className="text-sm text-muted-foreground">{translateStatus(result.status)}</p>
                            </div>
                        </div>

                        {result.tracking_url && (
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Guía de Transporte</p>
                                    <a href={result.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline hover:text-primary/80">
                                        Ver seguimiento transportadora
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
