import { motion } from 'framer-motion';
import { Ritual } from '@/lib/types';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RitualCardProps {
  ritual: Ritual;
  index: number;
}

export function RitualCard({ ritual, index }: RitualCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-500"
    >
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={ritual.imagen_url}
          alt={ritual.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {ritual.titulo}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {ritual.resumen}
        </p>
        
        <Link
          to={`/rituales#${ritual.titulo.toLowerCase().replace(/\s+/g, '-')}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          Leer más
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
