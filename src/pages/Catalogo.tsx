import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/products/ProductCard';
import { fetchProducts } from '@/lib/products';
import { Product } from '@/lib/types';
import { filterProductsByQuery } from '@/lib/searchUtils';
import { useSearchParams } from 'react-router-dom';
import { Search, X, LayoutGrid, List, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Catalogo = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoria') || '';
  const initialSearch = searchParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);
  
  // Async Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Products on Mount
  useEffect(() => {
    const loadProducts = async () => {
        setLoading(true);
        const data = await fetchProducts();
        if (data.length > 0) {
            setProducts(data);
        } else {
            console.warn("SheetDB returned empty.");
            setProducts([]);
        }
        setLoading(false);
    };
    loadProducts();
  }, []);

  // Filter out "Kits" from the Catalog page completely
  const catalogProducts = useMemo(() => {
    return products.filter(p => p.categoria.trim().toLowerCase() !== 'kits');
  }, [products]);

  // Sync/Validate Category from URL or initial state against loaded products
  useEffect(() => {
    if (!loading && catalogProducts.length > 0 && selectedCategory && selectedCategory !== 'Todos') {
        const categoryExists = catalogProducts.some(p => p.categoria === selectedCategory);
        if (!categoryExists) {
            console.warn(`Category '${selectedCategory}' not found in data. Resetting.`);
            setSelectedCategory('');
        }
    }
  }, [loading, catalogProducts, selectedCategory]);

  // Default to list on mobile (< 768px), grid on desktop
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => 
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid'
  );


  // Get unique categories (only from non-Kit products)
  const categories = useMemo(() => {
    const cats = [...new Set(catalogProducts.map((p) => p.categoria))];
    return ['Todos', ...cats];
  }, [catalogProducts]); // Depend on filtered catalogProducts

  // Get unique benefits
  const allBenefits = useMemo(() => {
    const benefits = new Set<string>();
    catalogProducts.forEach((p) => {
      p.beneficios.split(',').forEach((b) => benefits.add(b.trim()));
    });
    return [...benefits];
  }, [catalogProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    // First apply traditional filters
    const baseFiltered = catalogProducts.filter((product) => {
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

    // Then apply fuzzy search
    return filterProductsByQuery(baseFiltered, searchQuery);
  }, [catalogProducts, selectedCategory, selectedBenefits, searchQuery]);

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits((prev) =>
      prev.includes(benefit)
        ? prev.filter((b) => b !== benefit)
        : [...prev, benefit]
    );
  };

  if (loading) {
    return (
        <Layout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        </Layout>
    );
  }

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
              Productos 100% puros y naturales
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-10 relative"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar (ej. Lavanda, Relax...)"
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
          </motion.div>

          {/* Filters */}
            {/* Categories & View Toggle (Always Visible) */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                        key={category}
                        onClick={() =>
                            setSelectedCategory(category === 'Todos' ? '' : category)
                        }
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            (category === 'Todos' && !selectedCategory) ||
                            selectedCategory === category
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-white/80 backdrop-blur-sm text-foreground hover:bg-white border border-border/50 shadow-sm'
                        }`}
                        >
                        {category}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Filter Toggle Button */}
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            showFilters
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-white/80 backdrop-blur-sm text-muted-foreground hover:text-foreground border-dashed border-border hover:border-primary/50'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Ocultar Filtros' : 'Filtrar por Beneficios'}
                    </button>

                    {/* View Switcher */}
                    <div className="flex items-center bg-white/50 backdrop-blur-sm border border-border/50 rounded-full p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-full transition-all ${
                                viewMode === 'grid' 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-full transition-all ${
                                viewMode === 'list' 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'text-muted-foreground hover:bg-secondary'
                            }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Benefits Tags */}
            <motion.div
               initial={false}
               animate={{ height: showFilters ? 'auto' : 0, opacity: showFilters ? 1 : 0 }}
               className="overflow-hidden"
            >
               <div className="pb-8 pt-2">
                  <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Filtrar por Beneficio:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {allBenefits.map((benefit) => (
                        <button
                            key={benefit}
                            onClick={() => toggleBenefit(benefit)}
                            className={`px-3 py-1 text-sm rounded-full transition-all border ${
                            selectedBenefits.includes(benefit)
                                ? 'bg-accent text-accent-foreground border-accent'
                                : 'bg-background hover:bg-background/80 border-border text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {benefit}
                        </button>
                        ))}
                    </div>
                  </div>
               </div>
            </motion.div>

          {/* Products Grid/List */}
          <div className={`gap-6 ${
              viewMode === 'grid' 
              ? 'grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'flex flex-col max-w-4xl mx-auto'
          }`}>
            {filteredProducts.map((product) => (
              <ProductCard key={product.nombre} product={product} layout={viewMode} />
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
                  setSearchQuery('');
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
