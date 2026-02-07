import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContextDef';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  
  // State for manually passed order details (Clean URL)
  const manualOrder = location.state as { orderId: string, total: number } | null;

  const [status, setStatus] = useState<'loading' | 'success' | 'failure' | 'pending_validation'>('loading');
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  
  // Wompi sends ?id=TRANSACTION_ID
  const transactionId = searchParams.get('id');

  // Track processed IDs to prevent double execution in StrictMode
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    // SCENARIO 1: Manual Order (Redirected from Checkout.tsx)
    if (manualOrder?.orderId) {
        setStatus('success');
        setConfirmedOrderId(manualOrder.orderId);
        clearCart();
        return;
    }

    // SCENARIO 2: Wompi Redirect (Has Transaction ID)
    if (transactionId) {
        // Prevent double execution for the same ID
        if (processedRef.current === transactionId) return;

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
                        setConfirmedOrderId(data.orderId || transactionId); // Use internal ID if available
                        clearCart();
                        localStorage.removeItem('kaiu_checkout_data');
                    } else if (data.status === 'DECLINED' || data.status === 'ERROR' || data.status === 'VOIDED') {
                        setStatus('failure');
                    } else if (data.status === 'PENDING') {
                         if (attempts < maxAttempts) {
                             attempts++;
                             setTimeout(check, 2000);
                         } else {
                             console.warn("Transaction still pending after timeout.");
                             setStatus('pending_validation');
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
        return;
    }

    // SCENARIO 3: No Data (Direct Access)
    // If no state and no transaction ID, redirect to home
    if (!manualOrder && !transactionId) {
        // Optional: Redirect to home or show error
        // navigate('/');
        setStatus('failure');
    }

  }, [transactionId, clearCart, manualOrder]);

  const whatsappNumber = "573150718723";
  const whatsappMessage = confirmedOrderId 
    ? `Hola Kaiu! Acabo de realizar la orden #${confirmedOrderId} y quisiera más información.`
    : `Hola Kaiu! Tengo una duda sobre mi compra.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

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
                     <h1 className="font-display text-3xl font-bold text-foreground">¡Gracias por tu compra!</h1>
                     <p className="text-muted-foreground mt-2">
                        Hemos recibido tu orden correctamente. Te enviaremos un correo con los detalles.
                     </p>
                     {confirmedOrderId && (
                        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
                            <p className="text-sm font-medium text-foreground">Orden N°</p>
                            <p className="text-2xl font-mono text-primary">{confirmedOrderId}</p>
                        </div>
                     )}
                </div>
                
                <div className="flex flex-col w-full gap-3 mt-4">
                    <Button onClick={() => window.open(whatsappUrl, '_blank')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        Escríbenos por WhatsApp
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/catalogo')} className="w-full">
                        Seguir Comprando
                    </Button>
                </div>
            </div>
        )}

        {status === 'failure' && (
            <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10" />
                </div>
                <div>
                     <h1 className="font-display text-3xl font-bold text-foreground">Hubo un problema</h1>
                     <p className="text-muted-foreground mt-2">
                        No pudimos verificar tu pago o la transacción fue rechazada.
                     </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/checkout')}>Intentar Nuevamente</Button>
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
                        Tu pago está siendo procesado por el banco. Te notificaremos por correo cuando sea aprobado.
                     </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')}>Ir al Inicio</Button>
            </div>
        )}
      </div>
    </Layout>
  );
}
