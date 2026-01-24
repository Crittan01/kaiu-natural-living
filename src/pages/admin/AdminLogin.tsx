import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'PIN Incorrecto');
      }

      // Store Token securely (sessionStorage is fine for this use case, cleared on close)
      sessionStorage.setItem('kaiu_admin_token', data.token);
      navigate('/admin/dashboard');

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Acceso Administrativo</CardTitle>
          <CardDescription>Esta área es exclusiva para el comercio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN de Seguridad</Label>
              <Input 
                id="pin" 
                type="password" 
                placeholder="••••" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-destructive text-center font-medium">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ingresar al Panel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
