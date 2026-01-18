import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { mockRituals, mockProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MessageCircle, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

const Rituales = () => {
  const getRelatedProduct = (productName: string) => {
    return mockProducts.find((p) => 
      p.nombre.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(p.nombre.toLowerCase())
    );
  };

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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Rituales de Bienestar
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre cómo incorporar aceites naturales en tu vida diaria 
              para transformar momentos ordinarios en rituales de autocuidado
            </p>
          </motion.div>

          {/* Rituals */}
          <div className="space-y-16">
            {mockRituals.map((ritual, index) => (
              <motion.article
                key={ritual.titulo}
                id={ritual.titulo.toLowerCase().replace(/\s+/g, '-')}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="grid md:grid-cols-2 gap-8 items-center"
              >
                {/* Image */}
                <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-card">
                    <img
                      src={ritual.imagen_url}
                      alt={ritual.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                    <Leaf className="w-4 h-4" />
                    Ritual
                  </span>
                  
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                    {ritual.titulo}
                  </h2>
                  
                  <p className="mt-4 text-lg text-muted-foreground">
                    {ritual.resumen}
                  </p>
                  
                  <div className="mt-6 p-6 rounded-2xl bg-secondary/50 border border-border">
                    <p className="text-foreground leading-relaxed">
                      {ritual.contenido}
                    </p>
                  </div>

                  {/* Related Product */}
                  {ritual.productos_relacionados && (
                    <div className="mt-6 flex flex-wrap gap-3">
                      <span className="text-sm text-muted-foreground">
                        Producto recomendado:
                      </span>
                      <Link
                        to={`/catalogo?categoria=${encodeURIComponent(
                          getRelatedProduct(ritual.productos_relacionados)?.categoria || ''
                        )}`}
                        className="text-sm font-medium text-primary hover:text-accent transition-colors"
                      >
                        {ritual.productos_relacionados}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.article>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-primary to-kaiu-forest-light"
          >
            <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
              ¿Necesitas orientación personalizada?
            </h3>
            <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">
              Contáctanos y te ayudaremos a encontrar los aceites perfectos para tu ritual
            </p>
            <Button
              variant="gold"
              size="xl"
              className="mt-6"
              asChild
            >
              <a
                href="https://wa.me/521234567890?text=¡Hola!%20Necesito%20orientación%20sobre%20rituales%20con%20aceites%20esenciales"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5" />
                Hablar con un experto
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Rituales;
