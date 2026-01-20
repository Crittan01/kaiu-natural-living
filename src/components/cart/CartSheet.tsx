import { ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { CartItem } from './CartItem';
import { Link } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CartSheet() {
  const { items, cartTotal, itemCount, clearCart } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative group p-2 text-foreground hover:text-accent transition-colors">
          <ShoppingBag className="w-6 h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4 flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Tu Bolsa
          </SheetTitle>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-destructive text-xs h-8 px-2"
              onClick={clearCart}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Vaciar
            </Button>
          )}
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 my-4">
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Impuestos y envío calculados en el checkout.
              </p>
              <SheetFooter>
                <SheetClose asChild>
                  <Button className="w-full" size="lg" asChild>
                    <Link to="/checkout">
                      Ir a Pagar
                    </Link>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20" />
            <div className="space-y-2">
              <h3 className="font-medium text-lg">Tu bolsa está vacía</h3>
              <p className="text-muted-foreground">
                Parece que aún no has agregado productos.
              </p>
            </div>
            <SheetClose asChild>
              <Button variant="outline" asChild>
                <Link to="/catalogo">Explorar Catálogo</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
