
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts } from '@/lib/data';
import { filterProductsByQuery } from '@/lib/searchUtils';
import { Gift, Sparkles, Search, X, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Kits = () => {
  // Base products for Kits
  const baseKits = mockProducts.filter(p => p.categoria === 'Kits');

  // State
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // Default to list on mobile (< 768px), grid on desktop
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => 
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid'
  );

  // Get unique benefits for Kits only
  const allBenefits = useMemo(() => {
    const benefits = new Set<string>();
    baseKits.forEach((p) => {
      p.beneficios.split(',').forEach((b) => benefits.add(b.trim()));
    });
    return [...benefits];
  }, []);

  // Filter products logic
  const filteredKits = useMemo(() => {
    const filtered = baseKits.filter((product) => {
      const matchesBenefits =
        selectedBenefits.length === 0 ||
        selectedBenefits.some((b) =>
          product.beneficios.toLowerCase().includes(b.toLowerCase())
        );
      return matchesBenefits;
    });

    return filterProductsByQuery(filtered, searchQuery);
  }, [selectedBenefits, searchQuery]);

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit]
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
            className="text-center mb-12"
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

          {/* Controls Section (Search + Filters + View Toggle) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto mb-10 space-y-6"
          >
             {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar kits (ej. Sueño, Regalo...)"
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

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Benefits Filter */}
                <div className="flex flex-wrap justify-center gap-2">
                    {allBenefits.map((benefit) => (
                        <button
                        key={benefit}
                        onClick={() => toggleBenefit(benefit)}
                        className={`px-3 py-1 text-sm rounded-full transition-all ${
                            selectedBenefits.includes(benefit)
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                        >
                        {benefit}
                        </button>
                    ))}
                </div>

                 {/* View Toggle */}
                <div className="flex items-center bg-card border border-border rounded-full p-1 shadow-sm shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-full transition-all ${
                            viewMode === 'grid' 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                        title="Vista Cuadrícula"
                    >
                        <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button
                         onClick={() => setViewMode('list')}
                         className={`p-2 rounded-full transition-all ${
                            viewMode === 'list' 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'text-muted-foreground hover:bg-secondary'
                        }`}
                         title="Vista Lista"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </motion.div>

          {/* Kits Grid/List */}
          <div className={`gap-8 ${
              viewMode === 'grid' 
              ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'flex flex-col max-w-4xl mx-auto'
          }`}>
            {filteredKits.length > 0 ? (
              filteredKits.map((kit) => (
                <ProductCard key={kit.id} product={kit} layout={viewMode} />
              ))
            ) : (
               <div className="col-span-full text-center py-20 bg-secondary/10 rounded-3xl">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold text-foreground">
                     No se encontraron kits
                  </h3>
                  <p className="text-muted-foreground">
                     Prueba con otros términos de búsqueda.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedBenefits([]);
                      setSearchQuery('');
                    }}
                    className="mt-4 text-primary hover:text-accent transition-colors"
                  >
                    Limpiar filtros
                  </button>
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
