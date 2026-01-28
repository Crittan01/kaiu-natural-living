import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Package, Truck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TrackResult {
  id: string;
  pin?: string;
  carrier?: string;
  tracking_number?: string;
  status: string;
  fulfillment_status?: string;
  created_at: string;
  tracking_url?: string;
  total: number;
}

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract search logic
  const performSearch = async (queryId: string) => {
    if (!queryId) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/track-order?id=${queryId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No pudimos encontrar tu orden.');
      }
      setResult(data);
    } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // Auto-search if ?guide=XXX is present
  useEffect(() => {
    const guideParam = searchParams.get('guide');
    if (guideParam) {
        setOrderId(guideParam);
        performSearch(guideParam);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(orderId);
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
          'READY': 'Alistado / Listo para Envío',
          'PREPARING': 'En Preparación',
          'SHIPPED': 'En Tránsito (Enviado)',
          'SENT': 'Enviado',
          'DELIVERED': 'Entregado',
          'CANCELLED': 'Cancelado',
          'RETURNED': 'Devuelto',
          'INCIDENT': 'Novedad en Entrega'
      };
      return map[status?.toUpperCase()] || status;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-2xl min-h-[60vh]">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold mb-4">Rastrea tu Pedido</h1>
          <p className="text-muted-foreground">Ingresa el PIN (ej: 323...) o Número de Guía para ver el estado.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Búsqueda de Envíos</CardTitle>
            <CardDescription>Consulta el estado actual de tu compra en tiempo real.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-6">
              <Input 
                placeholder="Ej: 32336551 o 568139..." 
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
                            <h3 className="font-bold text-lg">Orden #{result.pin || result.id.substring(0,8)}</h3>
                            <p className="text-sm text-muted-foreground">Fecha: {new Date(result.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge className={`${getStatusColor(result.status)} text-white`}>
                            {translateStatus(result.status)}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        {/* Estado Logístico */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                                <Package className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Estado del Pedido</p>
                                <p className="text-sm text-muted-foreground">{translateStatus(result.status)}</p>
                            </div>
                        </div>

                        {/* Info de Transporte */}
                        {(result.carrier || result.tracking_number) && (
                            <div className="p-3 bg-muted/30 rounded-md border flex flex-col gap-2">
                                {result.carrier && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Transportadora:</span>
                                        <span className="font-medium">{result.carrier}</span>
                                    </div>
                                )}
                                {result.tracking_number && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Número de Guía:</span>
                                        <span className="font-mono font-medium">{result.tracking_number}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.tracking_url && (
                             <div className="flex items-center gap-3 mt-2">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-primary">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Seguimiento en Vivo</p>
                                    <a href={result.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline hover:text-primary/80">
                                        Ver ubicación del paquete &rarr;
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
