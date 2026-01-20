import { motion } from 'framer-motion';
import { mockProducts } from '@/lib/data';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeaturedProducts() {
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Productos destacados
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Selección de aceites puros y naturales para tu bienestar
          </p>
        </motion.div>

        {/* Products List - Mobile Compact */}
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {featuredProducts.map((product) => (
            <ProductCard key={product.nombre} product={product} layout="list" />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="default" size="lg" asChild>
            <Link to="/catalogo">
              Ver todo el catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
