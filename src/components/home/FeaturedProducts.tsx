import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/products/ProductCard';
import { fetchProducts } from '@/lib/products';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
         const data = await fetchProducts();
         setProducts(data.slice(0, 4)); 
         setLoading(false);
    };
    loadData();
  }, []);

  if (loading || products.length === 0) return null;

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

        {/* Products Grid - Desktop */}
        <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={`${product.nombre}-desktop`} product={product} />
          ))}
        </div>

        {/* Products List - Mobile Compact */}
        <div className="md:hidden flex flex-col gap-4 max-w-2xl mx-auto">
          {products.map((product) => (
            <ProductCard key={`${product.nombre}-mobile`} product={product} layout="list" />
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
