import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ username, password })
      });

      let data;
        const text = await res.text(); // Get raw text first
        if (!text) throw new Error('Respuesta vacía del servidor');
        
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parsing JSON:", text.substring(0, 200));
            throw new Error(`Error de Servidor (No JSON): ${res.status} ${res.statusText}`);
        }

      if (!res.ok) {
        throw new Error(data.error || 'Credenciales Incorrectas');
      }

      // Store Token securely (sessionStorage is fine for this use case, cleared on close)
      sessionStorage.setItem('kaiu_admin_token', data.token);
      sessionStorage.setItem('kaiu_admin_user', data.user.username);
      navigate('/dashboard');

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
      <Card className="w-full max-w-sm border-gray-200/60 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-kaiu-forest/10 rounded-full flex items-center justify-center mb-4 text-kaiu-forest ring-1 ring-kaiu-forest/20">
            <Lock className="w-5 h-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-800">Acceso KAIU</CardTitle>
          <CardDescription className="text-gray-500">Ingresa tus credenciales corporativas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Usuario Corporativo</Label>
              <Input 
                id="username" 
                placeholder="ej. gerente@kaiu.com" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                autoComplete="username"
                className="bg-gray-50/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contraseña Segura</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="bg-gray-50/50"
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}

            <Button type="submit" className="w-full bg-kaiu-forest hover:bg-kaiu-forest/90 text-white font-semibold transition-all" disabled={loading || password.length < 4}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Iniciar Sesión Segura"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
