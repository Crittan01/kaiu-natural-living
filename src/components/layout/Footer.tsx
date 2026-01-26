import { Link } from 'react-router-dom';
import { MessageCircleHeart, Instagram, Mail, Facebook, Music } from 'lucide-react';
import kaiuLogo from '@/assets/kaiu-logo.jpg';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={kaiuLogo} 
                alt="Kaiu" 
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="font-display text-2xl font-semibold">Kaiu</span>
            </div>
            <p className="text-primary-foreground/80 leading-relaxed">
              Nace del deseo de volver a lo esencial. Rituales diarios, cuidado del hogar, 
              conexión con lo natural, vivir con intención.
            </p>
          </div>

          {/* Links, Legal & Contact - Mobile 2 Columns, Desktop 3 */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Links */}
            <div className="flex flex-col gap-4">
              <h4 className="font-display text-lg font-semibold">Explora</h4>
              <div className="flex flex-col gap-2 text-sm md:text-base">
                <Link to="/catalogo" className="hover:text-accent transition-colors">
                  Catálogo
                </Link>
                <Link to="/rituales" className="hover:text-accent transition-colors">
                  Rituales
                </Link>
                <Link to="/faq" className="hover:text-accent transition-colors">
                  Preguntas (FAQ)
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-4">
              <h4 className="font-display text-lg font-semibold">Legal</h4>
              <div className="flex flex-col gap-2 text-sm md:text-base">
                <Link to="/terminos-condiciones" className="hover:text-accent transition-colors">
                  Términos y Condiciones
                </Link>
                <Link to="/politica-privacidad" className="hover:text-accent transition-colors">
                  Política de Privacidad
                </Link>
                <Link to="/derecho-retracto" className="hover:text-accent transition-colors">
                  Derecho de Retracto
                </Link>
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-4 col-span-2 md:col-span-1">
              <h4 className="font-display text-lg font-semibold">Contacto</h4>
              <div className="flex flex-col gap-3 text-sm md:text-base">
                <a 
                  href="https://wa.me/521234567890" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition-colors"
                >
                  <MessageCircleHeart className="w-4 h-4 shrink-0" />
                  WhatsApp
                </a>
                <a 
                  href="mailto:kaiu.oficialco@gmail.com" 
                  className="flex items-center gap-2 hover:text-accent transition-colors"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  Email
                </a>
                <a 
                  href="https://instagram.com/kaiu.oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition-colors"
                >
                  <Instagram className="w-4 h-4 shrink-0" />
                  Instagram
                </a>
                 <a 
                  href="https://facebook.com/kaiu.oficial" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition-colors"
                >
                  <Facebook className="w-4 h-4 shrink-0" />
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Kaiu Cosmética Natural. Hecho con 🌿 en Colombia.</p>
        </div>
      </div>
    </footer>
  );
}
