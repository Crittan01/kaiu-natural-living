import { motion } from 'framer-motion';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink, Heart } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variantes.split(',')[0]
  );
  const [isSaved, setIsSaved] = useState(false);

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
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {product.descripcion}
        </p>

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
