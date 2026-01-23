import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { useWishlist } from '@/context/WishlistContextDef';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <Layout>
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-accent fill-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Tu Lista de Deseos
            </h1>
            <p className="text-muted-foreground max-w-2xl text-lg">
              Aquí están los tesoros naturales que has guardado.
            </p>
          </motion.div>
        </div>

        {items.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <p className="text-xl text-muted-foreground mb-8">
              Aún no has guardado ningún producto.
            </p>
            <Button size="lg" asChild>
              <Link to="/catalogo">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Explorar Catálogo
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
