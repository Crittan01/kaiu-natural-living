import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContextDef';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failure' | 'pending_validation'>('loading');
  
  // Wompi sends ?id=TRANSACTION_ID
  const transactionId = searchParams.get('id');

  // Track processed IDs to prevent double execution in StrictMode
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
        setStatus('failure');
        return;
    }

    // Prevent double execution for the same ID
    if (processedRef.current === transactionId) {
        return;
    }

    const verifyTransaction = async () => {
        // Mark as processing immediately
        processedRef.current = transactionId;
        
        let attempts = 0;
        const maxAttempts = 5; // 10 seconds timeout
        
        const check = async () => {
            try {
                const res = await fetch(`/api/wompi/check-transaction/${transactionId}`);
                if (!res.ok) throw new Error('Error checking status');
                
                const data = await res.json();

                
                if (data.status === 'APPROVED') {
                    setStatus('success');
                    clearCart();
                    localStorage.removeItem('kaiu_checkout_data');
                } else if (data.status === 'DECLINED' || data.status === 'ERROR' || data.status === 'VOIDED') {
                    setStatus('failure');
                } else if (data.status === 'PENDING') {
                     if (attempts < maxAttempts) {
                         attempts++;
                         setTimeout(check, 2000);
                     } else {
                         // Still pending after timeout
                         console.warn("Transaction still pending after timeout.");
                         setStatus('pending_validation'); // Handle this new state
                     }
                } else {
                    setStatus('failure');
                }
            } catch (error) {
                console.error("Error verifying transaction:", error);
                setStatus('failure');
            }
        };
        
        check();
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
                        La transacción no fue aprobada o ocurrió un error.
                     </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/checkout')}>Volver al Checkout</Button>
            </div>
        )}

        {status === 'pending_validation' && (
            <div className="flex flex-col items-center gap-6">
                 <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin" />
                </div>
                <div>
                     <h1 className="font-display text-3xl font-bold text-foreground">Validando Pago...</h1>
                     <p className="text-muted-foreground mt-2">
                        Tu pago está en proceso de validación. Por favor revisa tu correo electrónico para la confirmación.
                     </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>Ir al Inicio</Button>
            </div>
        )}
      </div>
    </Layout>
  );
}
