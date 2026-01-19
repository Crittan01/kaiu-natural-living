import { motion } from 'framer-motion';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink, Heart, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variantes.split(',')[0]
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const benefits = product.beneficios.split(',');
  const variants = product.variantes.split(',');

  const handleWhatsApp = () => {
    const message = `¡Hola! Quiero comprar ${product.nombre} en tamaño ${selectedVariant}.`;
    window.open(
      `https://wa.me/521234567890?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement localStorage saving
  };

  const QuickViewContent = () => (
    <div className="grid md:grid-cols-2 h-[80vh] md:h-auto">
      {/* Modal Image */}
      <div className="relative h-64 md:h-full bg-secondary/20">
        <img
          src={product.imagen_url}
          alt={product.nombre}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Modal Content */}
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
            <h4 className="font-semibold text-foreground">Variantes Disponibles</h4>
            <div className="flex gap-2">
              {variants.map((variant) => (
                <button
                  key={variant}
                  onClick={() => setSelectedVariant(variant.trim())}
                  className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
                    selectedVariant === variant.trim()
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  {variant.trim()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex pt-4 border-t border-border mt-auto justify-end">
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

  return (
    <motion.div
      className="card-product group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Image */}
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
        
        {/* Quick View Trigger on Image */}
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

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {product.categoria}
        </span>

        {/* Name */}
        <h3 className="mt-2 font-display text-xl font-semibold text-foreground">
          {product.nombre}
        </h3>

        {/* Benefits */}
        <div className="mt-3 flex flex-wrap gap-2">
          {benefits.map((benefit) => (
            <span key={benefit} className="tag-benefit">
              {benefit.trim()}
            </span>
          ))}
        </div>

        {/* Description */}
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

        {/* Variants */}
        <div className="mt-4 flex gap-2">
          {variants.map((variant) => (
            <button
              key={variant}
              onClick={() => setSelectedVariant(variant.trim())}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                selectedVariant === variant.trim()
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-foreground hover:border-primary'
              }`}
            >
              {variant.trim()}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <Button
            variant="whatsapp"
            size="sm"
            className="flex-1"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="w-4 h-4" />
            Pedir
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={product.enlace_ml}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              Tienda
            </a>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
