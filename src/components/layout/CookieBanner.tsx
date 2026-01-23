import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check local storage
    const consent = localStorage.getItem('kaiu-cookie-consent');
    if (!consent) {
      // Show after a small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('kaiu-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
      // For strictly necessary cookies, we might still store a declination flag
      // but functionality remains basics.
      localStorage.setItem('kaiu-cookie-consent', 'declined');
      setIsVisible(false);
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 border-t border-border backdrop-blur-sm shadow-lg"
        >
          <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              <p>
                Utilizamos cookies para mejorar tu experiencia en KAIU. 
                Al navegar, aceptas nuestra política de privacidad y uso de cookies.
              </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDecline}>
                    Rechazar
                </Button>
                <Button size="sm" onClick={handleAccept}>
                    Aceptar
                </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
