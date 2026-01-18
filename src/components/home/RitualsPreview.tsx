import { motion } from 'framer-motion';
import { mockRituals } from '@/lib/data';
import { RitualCard } from '@/components/rituals/RitualCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function RitualsPreview() {
  const previewRituals = mockRituals.slice(0, 3);

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
            Rituales de bienestar
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Guías para incorporar aceites naturales en tu vida diaria
          </p>
        </motion.div>

        {/* Rituals Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewRituals.map((ritual, index) => (
            <RitualCard key={ritual.titulo} ritual={ritual} index={index} />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/rituales">
              Ver todos los rituales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
