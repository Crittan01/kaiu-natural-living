import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WompiWidgetProps {
  amountInCents: number;
  currency: string;
  reference: string;
  publicKey: string; // We get this from signature endpoint to be safe or env
  email: string;
  fullName: string;
  phoneNumber: string;
}

interface WompiTransaction {
    id: string;
    status: string;
    reference: string;
}

interface WompiResult {
    transaction: WompiTransaction;
}

interface WompiConfig {
    currency: string;
    amountInCents: number;
    reference: string;
    publicKey: string;
    signature?: { integrity: string };
    customerData?: {
        email: string;
        fullName: string;
        phoneNumber: string;
        phoneNumberPrefix: string;
        legalId?: string;
        legalIdType?: string;
    };
    redirectUrl?: string;
}

declare global {
  interface Window {
    WidgetCheckout: new (config: WompiConfig) => {
        open: (callback: (result: WompiResult) => void) => void;
    };
  }
}

export function WompiWidget({ 
    amountInCents, 
    currency, 
    reference, 
    email, 
    fullName,
    phoneNumber 
}: Omit<WompiWidgetProps, 'publicKey'>) {

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    setLoading(true);
    try {
        // 1. Get Integrity Signature from our Backend
        const res = await fetch('/api/wompi-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount_in_cents: amountInCents,
                currency,
                reference
            })
        });

        if (!res.ok) throw new Error('Error inicilizando pago');
        const data = await res.json();
        const { signature, public_key } = data;

        // 2. Open Wompi Widget
        const checkout = new window.WidgetCheckout({
            currency,
            amountInCents,
            reference,
            publicKey: public_key,
            signature: { integrity: signature }, // Valid only if Integrity Secret is set in Wompi Dashboard
            customerData: {
                email,
                fullName,
                phoneNumber,
                phoneNumberPrefix: '+57',
                legalId: '123456789', // Optional or pass real one
                legalIdType: 'CC'
            },
            redirectUrl: `${window.location.origin}/checkout/success`, // We need to handle this route!
        });

        checkout.open((result: WompiResult) => {
            const transaction = result.transaction;
            console.log("Transaction finished", transaction);
            // The redirect will happen anyway if configured, but we can also react here.
        });

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error de Pago",
            description: "No pudimos conectar con la pasarela de pagos.",
        });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    // Inject Script if not present
    const scriptId = 'wompi-sdk';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = "https://checkout.wompi.co/widget.js";
        script.async = true;
        document.body.appendChild(script);
    }
  }, []);

  return (
    <Button 
        onClick={handlePayment} 
        disabled={loading} 
        className="w-full bg-[#1A1A1A] hover:bg-[#333] text-white"
        size="lg"
    >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
        Pagar con Wompi
    </Button>
  );
}
