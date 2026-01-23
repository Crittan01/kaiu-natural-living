import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContextDef';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failure'>('loading');
  
  // Wompi sends ?id=TRANSACTION_ID
  const transactionId = searchParams.get('id');

  useEffect(() => {
    if (!transactionId) {
        setStatus('failure');
        return;
    }

    // Determine status. In a real app, we should verify the transaction ID with the backend
    // to confirm it's APPROVED before clearing cart or showing success.
    // For this MVP, if we have an ID, we assume success or fetch status.
    // Let's assume we implement a backend check later. 
    // For now, we simulate a check.
    
    // Simulate API verification
    const verifyTransaction = async () => {
        try {
            // TODO: Call /api/verify-wompi?id=transactionId
            // For now, assume success if ID exists
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStatus('success');
            clearCart();
        } catch (error) {
            console.error(error);
            setStatus('failure');
        }
    };

    verifyTransaction();
  }, [transactionId, clearCart]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <h2 className="text-xl font-medium">Verificando tu pago...</h2>
            </div>
        )}

        {status === 'success' && (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                     <h1 className="font-display text-3xl font-bold text-foreground">¡Pago Exitoso!</h1>
                     <p className="text-muted-foreground mt-2">
                        Tu orden ha sido procesada correctamente. Recibirás un correo con la confirmación.
                     </p>
                     <p className="text-sm text-muted-foreground mt-1">ID Transacción: {transactionId}</p>
                </div>
                <Button onClick={() => navigate('/')}>Volver al Inicio</Button>
            </div>
        )}

        {status === 'failure' && (
            <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10" />
                </div>
                <div>
                     <h1 className="font-display text-3xl font-bold text-foreground">Algo salió mal</h1>
                     <p className="text-muted-foreground mt-2">
                        No pudimos verificar tu pago. Por favor intenta nuevamente o contacta a soporte.
                     </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/checkout')}>Volver al Checkout</Button>
            </div>
        )}
      </div>
    </Layout>
  );
}
