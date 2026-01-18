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

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                className={`block p-8 rounded-3xl bg-gradient-to-br ${category.color} border border-border/50 hover:shadow-card transition-all duration-500 group`}
              >
                <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center shadow-soft mb-6 group-hover:scale-110 transition-transform">
                  <category.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-foreground">
                  {category.name}
                </h3>
                <p className="mt-2 text-muted-foreground">
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
