import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, DollarSign, Activity, Package, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

export default function OverviewPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const token = sessionStorage.getItem('kaiu_admin_token');

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
          navigate('/admin/login');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (mounted) setStats(data);
        } else {
            throw new Error("Failed to load stats");
        }
      } catch (error) {
        if (mounted) {
           toast({ title: "Error", description: "Fallo cargando estadísticas del panel", variant: "destructive" });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => { mounted = false; };
  }, [navigate, toast]);

  if (loading || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-10 border border-dashed rounded-xl border-border m-6">
         <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
         <p className="text-muted-foreground font-medium">Cargando Estadísticas Generales...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto space-y-6">
      <div>
         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Resumen KAIU</h2>
         <p className="text-sm text-muted-foreground">Monitoreo de métricas clave y desempeño</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
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
                              <RechartsTooltip 
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
                              <RechartsTooltip />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
}
