import { motion } from 'framer-motion';
import { Leaf, Heart, Sparkles, Shield } from 'lucide-react';

const values = [
  {
    icon: Leaf,
    title: '100% Natural',
    description: 'Sin químicos, parabenos ni fragancias sintéticas',
  },
  {
    icon: Heart,
    title: 'Bienestar Integral',
    description: 'Cuidado para cuerpo, mente y espíritu',
  },
  {
    icon: Sparkles,
    title: 'Calidad Premium',
    description: 'Aceites puros de proveedores certificados',
  },
  {
    icon: Shield,
    title: 'Envío Seguro',
    description: 'A toda Colombia',
  },
];

export function ValuesSection() {
  return (
    <section className="section-padding bg-primary text-primary-foreground">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            Nuestra filosofía
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
            Creemos en volver a lo esencial, conectar con la naturaleza y vivir con intención
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-xl md:rounded-2xl bg-primary-foreground/10 flex items-center justify-center mb-3 md:mb-4">
                <value.icon className="w-6 h-6 md:w-8 md:h-8 text-accent" />
              </div>
              <h3 className="font-display text-base md:text-xl font-semibold leading-tight">{value.title}</h3>
              <p className="mt-1 md:mt-2 text-xs md:text-sm text-primary-foreground/70 leading-snug">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
