import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { mockRituals, mockProducts } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MessageCircle, Leaf, ArrowRight, Search, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { filterRitualsByQuery } from '@/lib/searchUtils';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RitualProductRow } from '@/components/products/RitualProductRow';

const Rituales = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockRituals.forEach((r) => {
      r.tags.forEach((t) => tags.add(t));
    });
    return [...tags].sort();
  }, []);

  const filteredRituals = useMemo(() => {
    // 1. Text Search
    const searchFiltered = filterRitualsByQuery(mockRituals, searchQuery);

    // 2. Tag Filter
    return searchFiltered.filter((ritual) => {
      if (selectedTags.length === 0) return true;
      return selectedTags.some((tag) => ritual.tags.includes(tag));
    });
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

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

          {/* Search & Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-16 space-y-6"
          >
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar ritual (ej. Sueño, Energía...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 rounded-full border-primary/20 focus:border-primary bg-background/50 backdrop-blur-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Tags Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Rituals */}
          <div className="space-y-16">
            {filteredRituals.length > 0 ? (
              filteredRituals.map((ritual, index) => (
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

                    {/* Related Products - Preview Modal */}
                    {ritual.productos_relacionados && ritual.productos_relacionados.length > 0 && (
                      <div className="mt-8">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full md:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Ver productos del ritual
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border-primary/10">
                            <DialogHeader>
                              <DialogTitle className="font-display text-2xl text-center text-primary mb-2">
                                Esenciales para tu Ritual
                              </DialogTitle>
                              <p className="text-center text-muted-foreground text-sm">
                                Estos son los productos recomendados para la experiencia completa:
                              </p>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4 mt-2">
                              {ritual.productos_relacionados.map((productName) => {
                                 const product = getRelatedProduct(productName);
                                 if (!product) return null;
                                 
                                 return (
                                   <RitualProductRow key={productName} product={product} />
                                 );
                              })}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">
                  No encontramos rituales que coincidan con tu búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                  }}
                  className="mt-4 text-primary hover:text-accent transition-colors"
                >
                  Ver todos los rituales
                </button>
              </div>
            )}
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
