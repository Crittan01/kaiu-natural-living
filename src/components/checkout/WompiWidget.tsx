import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';

interface WompiWidgetProps {
    amountInCents: number;
    currency: string;
    reference: string;
    email: string;
    fullName: string;
    phoneNumber: string;
}

export function WompiWidget({ amountInCents, currency, reference, email, fullName, phoneNumber }: WompiWidgetProps) {
    const [signature, setSignature] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Vite uses import.meta.env.
    const PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUB_KEY;

    useEffect(() => {
        const fetchSignature = async () => {
             setLoading(true);
             setError(null);
             try {
                 const res = await fetch('/api/wompi/sign', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ reference, amount: amountInCents, currency })
                 });
                 
                 const data = await res.json();
                 
                 if (!res.ok) throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
                 
                 setSignature(data.signature);
             } catch (err: any) {
                 console.error("Wompi Sign Error:", err);
                 setError(err.message || "Error al conectar con el servidor de pagos.");
             } finally {
                 setLoading(false);
             }
        };

        if (amountInCents > 0 && PUBLIC_KEY) {
            fetchSignature();
        } else if (!PUBLIC_KEY) {
            setError("Falta llave pública de Wompi (VITE_WOMPI_PUB_KEY)");
            setLoading(false);
        }
    }, [amountInCents, currency, reference, PUBLIC_KEY]);

    if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /> <span className="ml-2 text-sm">Preparando pago seguro...</span></div>;
    if (error) return <div className="text-red-500 text-sm p-4 bg-red-50 rounded border border-red-200">{error}</div>;

    // Standard HTML Integration (Direct Form)
    // Docs: https://docs.wompi.co/en/docs/web-checkout/integrate/
    // Verificamos si usar la URL de checkout redirect
    const CHECKOUT_URL = "https://checkout.wompi.co/p/";

    return (
        <form action={CHECKOUT_URL} method="GET">
            {/* Required Fields */}
            <input type="hidden" name="public-key" value={PUBLIC_KEY} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="amount-in-cents" value={amountInCents} />
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="signature:integrity" value={signature || ''} />
            
            {/* Optional User Data (Auto-fill) */}
            <input type="hidden" name="customer-data:email" value={email} />
            <input type="hidden" name="customer-data:full-name" value={fullName} />
            {/* <input type="hidden" name="customer-data:phone-number" value={phoneNumber} /> */}
            <input type="hidden" name="customer-data:phone-number" value={phoneNumber} />
            
            {/* Redirect URL - Returns user to this URL after payment */}
            <input type="hidden" name="redirect-url" value={typeof window !== 'undefined' ? `${window.location.origin}/checkout/success` : ''} />

            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 text-lg shadow-md transition-all">
                <CreditCard className="mr-2 w-5 h-5"/>
                Pagar ${ (amountInCents / 100).toLocaleString() } con Wompi
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-2">
                 Serás redirigido al sitio seguro de Bancolombia.
            </p>
        </form>
    );
}
