
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts } from '@/lib/data';
import { Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Kits = () => {
  // Filter products for Kits
  const kits = mockProducts.filter(p => p.categoria === 'Kits');

  return (
    <Layout>
      <section className="section-padding">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
               <Gift className="w-4 h-4" />
               Regala Bienestar
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Kits & Regalos
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Selección curada de nuestros mejores aceites para crear experiencias completas.
            </p>
          </motion.div>

          {/* Kits Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {kits.length > 0 ? (
              kits.map((kit, index) => (
                <motion.div
                    key={kit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <ProductCard product={kit} />
                </motion.div>
              ))
            ) : (
               <div className="col-span-full text-center py-20 bg-secondary/10 rounded-3xl">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground">
                     Próximamente
                  </h3>
                  <p className="text-muted-foreground">
                     Estamos preparando nuevos kits mágicos para ti.
                  </p>
               </div>
            )}
          </div>

           {/* Banner */}
           <div className="mt-20 relative rounded-3xl overflow-hidden bg-primary text-primary-foreground text-center py-16 px-6">
              <div className="relative z-10 max-w-2xl mx-auto">
                 <h2 className="font-display text-3xl font-bold mb-4">
                   ¿Regalos Corporativos?
                 </h2>
                 <p className="text-primary-foreground/80 mb-8">
                   Personalizamos kits de bienestar para empresas y eventos.
                 </p>
                 <Button variant="gold" size="lg" asChild>
                    <a href="https://wa.me/521234567890?text=Hola,%20me%20interesan%20los%20regalos%20corporativos" target="_blank" rel="noreferrer">
                        Cotizar Personalización
                    </a>
                 </Button>
              </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Kits;
