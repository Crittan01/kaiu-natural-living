
import { useState } from 'react';
import { Product, Variant } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Check } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, otherwise remove

interface RitualProductRowProps {
  product: Product;
}

export function RitualProductRow({ product }: RitualProductRowProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variantes[0]
  );
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, selectedVariant);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000); // Visual feedback
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-secondary/10 border border-border/50 hover:border-primary/20 transition-all">
      {/* Image */}
      <div className="w-full sm:w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm shrink-0 mx-auto sm:mx-0">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Info & Controls */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-display font-bold text-base text-foreground leading-tight">
                {product.nombre}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {product.categoria}
                </p>
            </div>
            <div className="text-right">
                <span className="font-bold text-primary block">
                    ${selectedVariant.precio.toLocaleString()}
                </span>
                 {selectedVariant.precio_antes && (
                    <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                        ${selectedVariant.precio_antes.toLocaleString()}
                    </span>
                )}
            </div>
        </div>

        {/* Variant Selector & Add Button Row */}
        <div className="flex items-center gap-3 mt-auto">
            {/* Simple Pill Selector for Variants */}
             <div className="flex gap-1 bg-background p-1 rounded-lg border border-input">
              {product.variantes.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    "px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all",
                    selectedVariant.id === variant.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {variant.nombre}
                </button>
              ))}
            </div>

            <Button 
                size="sm" 
                className={cn(
                    "ml-auto h-8 text-xs transition-all",
                    isAdded ? "bg-green-600 hover:bg-green-700 text-white" : ""
                )}
                onClick={handleAddToCart}
            >
                {isAdded ? (
                    <>
                        <Check className="w-3 h-3 mr-1" /> Agregado
                    </>
                ) : (
                    <>
                         <ShoppingBag className="w-3 h-3 mr-2 sm:mr-0 md:mr-2" /> 
                         <span className="sm:hidden md:inline">Agregar</span>
                    </>
                )}
            </Button>
        </div>
      </div>
    </div>
  );
}
