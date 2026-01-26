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
  const [status, setStatus] = useState<'loading' | 'success' | 'failure'>('loading');
  
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
        
        try {
            // 1. Verify payment status (Using backend or simple check)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // 2. Retrieve Checkout Data (User Info)
            const savedData = localStorage.getItem('kaiu_checkout_data');
            
            let formData;
            
            if (savedData) {
                 formData = JSON.parse(savedData);
            } else {
                 // FALLBACK: Only for Development to test flow without re-filling forms
                 // In Production, this should fail gracefully or ask user to contact support if data is lost.
                 if (process.env.NODE_ENV === 'development') {
                     console.warn("⚠️ [DEV MODE] No local data found. Using MOCK data.");
                     formData = {
                        nombre: "Usuario Prueba Dev",
                        email: "dev@kaiu.co",
                        telefono: "3000000000",
                        identificacion: "123456789",
                        departamento_code: "ANT",
                        ciudad_code: "05001000",
                        direccion: "Calle Falsa 123 Dev",
                        barrio: "Centro",
                        payment_method: "EXTERNAL_PAYMENT",
                        termsAccepted: true
                     };
                 } else {
                     // In production, we cannot invent data.
                     console.error("❌ Critical: No saved checkout data found in production.");
                     throw new Error("Datos de sesión perdidos. Por favor contacta a soporte el ID: " + transactionId);
                 }
            }

            // 3. Retrieve Cart Items
            const cartItems = JSON.parse(localStorage.getItem('kaiu_cart') || '[]');
            
            if (cartItems.length === 0) {
                 console.warn("Carrito vacío. Usando item de prueba.");
            }

            // 4. Create Order Payload
            const orderPayload = {
                billing_info: {
                    first_name: formData.nombre.split(' ')[0],
                    last_name: formData.nombre.split(' ').slice(1).join(' ') || '.',
                    email: formData.email,
                    phone: formData.telefono,
                    identification_type: "CC", 
                    identification: formData.identificacion 
                },
                shipping_info: {
                    first_name: formData.nombre.split(' ')[0],
                    last_name: formData.nombre.split(' ').slice(1).join(' ') || '.',
                    address_1: `${formData.direccion}, ${formData.barrio}`,
                    city_code: formData.ciudad_code || "05001000",
                    subdivision_code: formData.departamento_code || "05",
                    country_code: "CO",
                    phone: formData.telefono
                },
                line_items: cartItems.length > 0 ? cartItems.map((item: any) => ({
                    sku: item.selectedVariant.sku,
                    name: item.nombre,
                    unit_price: item.selectedVariant.precio,
                    quantity: item.quantity,
                    weight: item.selectedVariant.peso || 0.2, 
                    weight_unit: "KG",
                    dimensions_unit: "CM",
                    height: item.selectedVariant.alto || 10,
                    width: item.selectedVariant.ancho || 10,
                    length: item.selectedVariant.largo || 10,
                    type: "STANDARD"
                })) : [{
                    sku: "TEST-ITEM",
                    name: "Item de Prueba (Carrito Perdido)",
                    unit_price: 1000,
                    quantity: 1,
                    weight: 1,
                    weight_unit: "KG", 
                    dimensions_unit: "CM",
                    height: 10, width: 10, length: 10,
                    type: "STANDARD"
                }],
                payment_method_code: "EXTERNAL_PAYMENT", 
                external_order_id: transactionId, 
                payment_status_external: "APPROVED",
                discounts: []
            };

            // 5. Send to Backend
            console.log("Enviando orden a backend:", orderPayload);
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error creando orden en Venndelo');

            console.log("✅ Orden Wompi Creada:", data);

            setStatus('success');
            clearCart();
            localStorage.removeItem('kaiu_checkout_data');

        } catch (error) {
            console.error("Error creating order:", error);
            // Don't show failure if we already engaged? No, if it failed it failed.
            // But if it failed because it ran twice, the check at top returns early.
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
