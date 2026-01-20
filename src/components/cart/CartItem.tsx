import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart, CartItem as CartItemType } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-border/50">
      {/* Image */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border">
        <img
          src={item.imagen_url}
          alt={item.nombre}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="grid gap-1">
          <h3 className="font-medium text-foreground line-clamp-2">
            {item.nombre}
          </h3>
          <p className="text-sm text-muted-foreground">
            {item.selectedVariant.nombre} · {item.selectedVariant.sku}
          </p>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          {/* Quantity Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.id, item.selectedVariant.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={() => updateQuantity(item.id, item.selectedVariant.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="font-medium text-primary">
              ${(item.selectedVariant.precio * item.quantity).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Remove Button */}
      <button
        onClick={() => removeFromCart(item.id, item.selectedVariant.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Eliminar"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
