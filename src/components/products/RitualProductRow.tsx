
import { useState, useMemo } from 'react';
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

  // Grouping Logic (duplicated from ProductCard for self-containment)
  const variantGroups = useMemo(() => {
    const groups: Record<string, Variant[]> = {};
    const types = new Set<string>();
    const keywords = [
        { key: 'roll', label: 'Roll-on' },
        { key: 'gotero', label: 'Gotero' },
        { key: 'cuenta gotas', label: 'Gotero' },
        { key: 'spray', label: 'Spray' },
         { key: 'kit', label: 'Kit' },
        { key: 'difusor', label: 'Difusor' }
    ];

    product.variantes.forEach(v => {
        let type = 'Estándar';
        const name = v.nombre.toLowerCase();
        for (const kw of keywords) {
            if (name.includes(kw.key)) {
                type = kw.label;
                break;
            }
        }
        if (!groups[type]) groups[type] = [];
        groups[type].push(v);
        types.add(type);
    });

    const isGrouped = types.size > 1 || (types.size === 1 && !types.has('Estándar'));
    return { isGrouped, types: Array.from(types).sort(), groups };
  }, [product.variantes]);

  const getCleanVariantName = (name: string, type: string) => {
    if (type === 'Estándar') return name;
    return name.replace(new RegExp(`${type}\\s*|-?\\s*`, 'i'), '').trim() || name;
  };

  const isOutOfStock = selectedVariant.stock?.toUpperCase().includes('AGOTADO');

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-secondary/10 border border-border/50 hover:border-primary/20 transition-all">
      {/* Image */}
      <div className="w-full sm:w-20 h-20 rounded-lg overflow-hidden bg-white shadow-sm shrink-0 mx-auto sm:mx-0 relative">
        <img
          src={selectedVariant.imagen_url || product.imagen_url}
          alt={`${product.nombre} ${selectedVariant.nombre}`}
          className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale opacity-70' : ''}`}
          referrerPolicy="no-referrer"
        />
        {isOutOfStock && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <span className="bg-black/70 text-white px-1 py-0.5 rounded text-[8px] font-bold">AGOTADO</span>
            </div>
        )}
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
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-auto">
            {/* Grouped Variant Selector */}
             <div className="flex flex-col gap-1 w-full sm:w-auto">
                {variantGroups.types.map((type) => (
                    <div key={type} className="flex flex-wrap items-center gap-1.5">
                        {variantGroups.isGrouped && (
                            <span className="text-[10px] font-semibold text-muted-foreground mr-0.5">
                                {type}:
                            </span>
                        )}
                        {variantGroups.groups[type].map((variant) => (
                            <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={cn(
                                "px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all border",
                                selectedVariant.id === variant.id
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-input hover:text-foreground hover:bg-secondary",
                                variant.stock?.toUpperCase().includes('AGOTADO') ? "opacity-50 line-through decoration-destructive" : ""
                            )}
                            >
                            {variantGroups.isGrouped ? getCleanVariantName(variant.nombre, type) : variant.nombre}
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            <Button 
              size="sm" 
              className={cn(
                "w-full sm:w-auto shrink-0",
                isAdded ? "bg-green-600 hover:bg-green-700 text-white" : ""
              )}
              disabled={isAdded || isOutOfStock}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Agregado
                </>
              ) : isOutOfStock ? (
                   "Agotado"
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Agregar
                </>
              )}
            </Button>
        </div>
      </div>
    </div>
  );
}
