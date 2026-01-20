import { motion } from 'framer-motion';
import { Product, Variant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink, Heart, Eye, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useEffect } from 'react';
import { useWishlist } from '@/context/WishlistContext';

interface ProductCardProps {
  product: Product;
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, layout = 'grid' }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant>(
    product.variantes[0]
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isSaved = isInWishlist(product.id);

  const benefits = product.beneficios.split(',');

  // Keep selectedVariant in sync if props change (though typically static)
  // Not strictly necessary if product doesn't change, but good practice
  useEffect(() => {
    if (product.variantes.length > 0) {
      setSelectedVariant(product.variantes[0]);
    }
  }, [product]);


  const handleWhatsApp = () => {
    const message = `¡Hola! Quiero comprar ${product.nombre} en tamaño ${selectedVariant.nombre}.`;
    window.open(
      `https://wa.me/521234567890?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (isSaved) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const QuickViewContent = () => (
    <div className="grid md:grid-cols-2 h-[80vh] md:h-auto">
      <div className="relative h-64 md:h-full bg-secondary/20">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <ScrollArea className="h-full max-h-[calc(80vh-2rem)] md:max-h-[600px]">
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {product.categoria}
            </span>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl md:text-3xl font-bold mt-2">
                {product.nombre}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex flex-wrap gap-2">
            {benefits.map((benefit) => (
              <span key={benefit} className="tag-benefit">
                {benefit.trim()}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Descripción</h4>
            <p className="text-muted-foreground leading-relaxed">
              {product.descripcion}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Selecciona Tamaño</h4>
            <div className="flex gap-2">
              {product.variantes.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                    selectedVariant.id === variant.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  {variant.nombre} - ${variant.precio.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          
           <div className="mt-4">
            <p className="text-2xl font-bold text-primary">
               ${selectedVariant.precio.toLocaleString()}
            </p>
           </div>

          <div className="flex pt-4 border-t border-border mt-auto justify-end gap-2">
              <Button 
                className="flex-1"
                onClick={() => addToCart(product, selectedVariant)}
              >
                Agregar al Carrito
              </Button>
             <DialogClose asChild>
              <Button variant="outline">
                Cerrar
              </Button>
            </DialogClose>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (layout === 'list') {
    return (
      <motion.div
        className="group relative bg-card rounded-2xl border border-border/50 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-row"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Image Section */}
        <div className="w-32 sm:w-48 md:w-1/3 min-w-[120px] relative aspect-[3/4] md:aspect-auto overflow-hidden shrink-0">
             <img
              src={product.imagen_url}
              alt={product.nombre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
             <button
              onClick={handleSave}
              className="absolute top-2 right-2 md:top-4 md:right-4 w-7 h-7 md:w-9 md:h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-card shadow-sm"
            >
              <Heart
                className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-colors ${
                  isSaved ? 'fill-accent text-accent' : 'text-muted-foreground'
                }`}
              />
            </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 flex flex-col">
            <div className="flex justify-between items-start mb-1 md:mb-2">
                 <div>
                    <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {product.categoria}
                    </span>
                    <h3 className="mt-0.5 md:mt-1 font-display text-base md:text-xl font-semibold text-foreground leading-tight">
                    {product.nombre}
                    </h3>
                 </div>
                 <div className="text-right hidden sm:block">
                     <p className="text-xl font-bold text-primary">
                        ${selectedVariant.precio.toLocaleString()}
                    </p>
                    {selectedVariant.precio_antes && (
                        <p className="text-sm text-muted-foreground line-through decoration-destructive/50">
                        ${selectedVariant.precio_antes.toLocaleString()}
                        </p>
                    )}
                 </div>
            </div>

            <p className="text-muted-foreground text-xs md:text-sm line-clamp-2 mb-2 md:mb-4 flex-1 hidden sm:block">
                {product.descripcion}
            </p>

            <div className="mt-auto space-y-2 md:space-y-4">
                 {/* Variants - Compact on mobile */}
                 <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
                    <span className="text-xs md:text-sm text-muted-foreground mr-1 hidden sm:inline">Tamaño:</span>
                    {product.variantes.map((variant) => (
                        <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-2 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs font-medium rounded-full border transition-colors ${
                            selectedVariant.id === variant.id
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border text-foreground hover:border-primary'
                        }`}
                        >
                        {variant.nombre}
                        </button>
                    ))}
                 </div>

                 {/* Mobile Price (if hidden above) */}
                 <div className="flex sm:hidden items-baseline gap-2">
                     <span className="text-base font-bold text-primary">
                        ${selectedVariant.precio.toLocaleString()}
                    </span>
                    {selectedVariant.precio_antes && (
                        <span className="text-[10px] text-muted-foreground line-through decoration-destructive/50">
                        ${selectedVariant.precio_antes.toLocaleString()}
                        </span>
                    )}
                 </div>

                 {/* Actions */}
                 <div className="flex gap-2 md:gap-3">
                     <Button
                        size="sm"
                        className="flex-1 sm:flex-none sm:min-w-[140px] h-8 md:h-9 text-xs md:text-sm"
                        onClick={() => addToCart(product, selectedVariant)}
                     >
                        <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                        Agregar
                     </Button>
                     
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="hidden sm:flex">
                                <Eye className="w-4 h-4 mr-2" />
                                Vista Rápida
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
                            <QuickViewContent />
                        </DialogContent>
                     </Dialog>
                 </div>
            </div>
        </div>
      </motion.div>
    );
  }

  // DEFAULT GRID VIEW
  return (
    <motion.div
      className="card-product group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <button
          onClick={handleSave}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-card"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isSaved ? 'fill-accent text-accent' : 'text-muted-foreground'
            }`}
          />
        </button>
        
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              title="Vista Rápida"
            >
              <Eye className="w-5 h-5 text-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
            <QuickViewContent />
          </DialogContent>
        </Dialog>
      </div>

      <div className="p-5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {product.categoria}
        </span>

        <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
          {product.nombre}
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {benefits.map((benefit) => (
            <span key={benefit} className="tag-benefit">
              {benefit.trim()}
            </span>
          ))}
        </div>

        <div className="mt-3">
          <p className={`text-sm text-muted-foreground transition-all duration-300 ${
            isExpanded ? '' : 'line-clamp-2'
          }`}>
            {product.descripcion}
          </p>
          {product.descripcion.length > 80 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full text-xs font-medium border-primary/20 hover:bg-primary/5 hover:text-primary"
                >
                  <Eye className="w-3 h-3 mr-2" />
                  Vista Rápida
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background">
                <QuickViewContent />
              </DialogContent>
            </Dialog>
          )}
        </div>


        {/* Price and Variants Row */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
             <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                ${selectedVariant.precio.toLocaleString()}
              </span>
              {selectedVariant.precio_antes && (
                <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
                  ${selectedVariant.precio_antes.toLocaleString()}
                </span>
              )}
            </div>
            
             <div className="flex gap-1">
              {product.variantes.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-2 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                    selectedVariant.id === variant.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:border-primary'
                  }`}
                >
                  {variant.nombre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <Button
            variant="default" 
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => addToCart(product, selectedVariant)}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Agregar
          </Button>
          <Button variant="outline" size="icon" onClick={handleSave} title={isSaved ? "Quitar de lista" : "Guardar para después"}>
             <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved ? 'fill-accent text-accent' : 'text-muted-foreground'
              }`}
            />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
