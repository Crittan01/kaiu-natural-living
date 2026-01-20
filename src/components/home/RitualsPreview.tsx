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

        {/* Rituals List - Mobile Compact */}
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {previewRituals.map((ritual, index) => (
             <Link 
                to={`/rituales#${ritual.titulo.toLowerCase().replace(/\s+/g, '-')}`} 
                key={ritual.titulo}
                className="flex gap-4 p-3 bg-secondary/10 rounded-2xl items-center hover:bg-secondary/20 transition-colors"
             >
                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                    <img src={ritual.imagen_url} alt={ritual.titulo} className="w-full h-full object-cover" />
                </div>
                <div>
                     <h3 className="font-display font-bold text-foreground text-lg">{ritual.titulo}</h3>
                     <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">{ritual.resumen}</p>
                     <span className="text-xs font-medium text-primary mt-1 inline-flex items-center">
                        Ver ritual <ArrowRight className="w-3 h-3 ml-1" />
                     </span>
                </div>
             </Link>
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
