import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Leaf, Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { CartSheet } from '@/components/cart/CartSheet';
import { Button } from '@/components/ui/button';
import kaiuLogo from '@/assets/kaiu-logo.jpg';

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/rituales', label: 'Rituales' },
  { href: '/kits', label: 'Kits' },
  { href: '/faq', label: 'Preguntas' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { items } = useWishlist();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 glass-effect border-b border-border/50">
      <nav className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={kaiuLogo} 
              alt="Kaiu Cosmética Natural" 
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover"
            />
            <span className="font-display text-xl md:text-2xl font-semibold text-primary">
              Kaiu
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-medium transition-colors duration-300 hover:text-accent ${
                  location.pathname === link.href
                    ? 'text-accent'
                    : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            <Link to="/wishlist" className="relative group mr-4" aria-label="Lista de Deseos">
              <Heart className={`w-6 h-6 transition-colors ${location.pathname === '/wishlist' ? 'text-accent fill-accent' : 'text-foreground group-hover:text-accent'}`} />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                  {items.length}
                </span>
              )}
            </Link>
            
            <CartSheet />
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <Button variant="gold" size="sm" asChild>
              <a
                href="https://wa.me/521234567890?text=¡Hola!%20Estoy%20desde%20la%20app%20de%20Kaiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Leaf className="w-4 h-4" />
                Contactar
              </a>
            </Button>
          </div>

          
          <div className="flex md:hidden items-center gap-4">
            <CartSheet />
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-effect border-b border-border/50"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium py-2 transition-colors duration-300 ${
                    location.pathname === link.href
                      ? 'text-accent'
                      : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <Link
                to="/wishlist" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 font-medium py-2 text-foreground hover:text-accent"
              >
                <Heart className="w-5 h-5" />
                Lista de Deseos ({items.length})
              </Link>
              <Button variant="gold" className="mt-2" asChild>
                <a
                  href="https://wa.me/521234567890?text=¡Hola!%20Estoy%20desde%20la%20app%20de%20Kaiu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contactar por WhatsApp
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
