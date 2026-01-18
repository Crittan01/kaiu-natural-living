import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { mockProducts } from '@/lib/data';
import { useSearchParams } from 'react-router-dom';

const Catalogo = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoria') || '';
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(mockProducts.map((p) => p.categoria))];
    return ['Todos', ...cats];
  }, []);

  // Get unique benefits
  const allBenefits = useMemo(() => {
    const benefits = new Set<string>();
    mockProducts.forEach((p) => {
      p.beneficios.split(',').forEach((b) => benefits.add(b.trim()));
    });
    return [...benefits];
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesCategory =
        !selectedCategory ||
        selectedCategory === 'Todos' ||
        product.categoria === selectedCategory;
      
      const matchesBenefits =
        selectedBenefits.length === 0 ||
        selectedBenefits.some((b) =>
          product.beneficios.toLowerCase().includes(b.toLowerCase())
        );

      return matchesCategory && matchesBenefits;
    });
  }, [selectedCategory, selectedBenefits]);

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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Nuestro Catálogo
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Aceites esenciales y vegetales 100% puros y naturales
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 space-y-6"
          >
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() =>
                    setSelectedCategory(category === 'Todos' ? '' : category)
                  }
                  className={`px-5 py-2 rounded-full font-medium transition-all ${
                    (category === 'Todos' && !selectedCategory) ||
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'bg-card text-foreground hover:bg-secondary border border-border'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

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
          </motion.div>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.nombre} product={product} />
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                No encontramos productos con esos filtros.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedBenefits([]);
                }}
                className="mt-4 text-primary hover:text-accent transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Catalogo;
