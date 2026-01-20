import { motion } from 'framer-motion';
import { Droplets, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    name: 'Aceites Esenciales',
    description: 'Aromas puros para difusores, masajes y bienestar',
    icon: Droplets,
    color: 'from-primary/10 to-primary/5',
    href: '/catalogo?categoria=Aceites%20Esenciales',
  },
  {
    name: 'Aceites Vegetales',
    description: 'Nutrición natural para piel y cabello',
    icon: Leaf,
    color: 'from-accent/10 to-accent/5',
    href: '/catalogo?categoria=Aceites%20Vegetales',
  },
];

export function CategoriesSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Explora por categoría
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Encuentra el aceite perfecto para tu ritual diario
          </p>
        </motion.div>

        {/* Categories Grid - Mobile Compact */}
        <div className="grid grid-cols-2 gap-4 max-w-4xl mx-auto">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={category.href}
                className={`block p-4 md:p-8 rounded-2xl md:rounded-3xl bg-gradient-to-br ${category.color} border border-border/50 hover:shadow-card transition-all duration-500 group h-full`}
              >
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-card flex items-center justify-center shadow-soft mb-3 md:mb-6 group-hover:scale-110 transition-transform">
                  <category.icon className="w-5 h-5 md:w-7 md:h-7 text-primary" />
                </div>
                <h3 className="font-display text-lg md:text-2xl font-semibold text-foreground leading-tight">
                  {category.name}
                </h3>
                <p className="mt-1 md:mt-2 text-xs md:text-base text-muted-foreground line-clamp-2 md:line-clamp-none">
                  {category.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
