import { Separator } from '@/components/ui/separator';
import { Loader2, Check } from 'lucide-react';
import { CartItem } from '@/context/CartContextDef';

interface OrderSummaryProps {
  items: CartItem[];
  cartTotal: number;
  shippingCost: number | null;
  shippingStatus: 'calculated' | 'tbd' | null;
  isQuoting: boolean;
  finalTotal: number;
}

export const OrderSummary = ({
  items,
  cartTotal,
  shippingCost,
  shippingStatus,
  isQuoting,
  finalTotal
}: OrderSummaryProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border/50">
        <h2 className="font-display text-xl font-bold mb-4">Resumen de tu Orden</h2>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {items.map((item) => (
            <div key={`${item.id}-${item.selectedVariant.sku}`} className="flex gap-4 items-start">
              <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden shrink-0">
                <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-foreground">{item.nombre}</h4>
                <p className="text-xs text-muted-foreground">{item.selectedVariant.nombre}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
                  <p className="font-medium text-sm">${(item.selectedVariant.precio * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Envío</span>
            {isQuoting ? (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Calculando...
              </span>
            ) : shippingStatus === 'tbd' ? (
              <span className="font-medium text-orange-600">A Coordinar</span>
            ) : shippingCost !== null ? (
              <span className="font-medium">${shippingCost.toLocaleString()}</span>
            ) : (
              <span className="text-muted-foreground italic">--</span>
            )}
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 text-primary">
            <span>Total (Pagar)</span>
            <span>${finalTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Pago Seguro via Venndelo / Wompi</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Aceites 100% Puros y Naturales</p>
          </div>
        </div>
      </div>
    </div>
  );
};
