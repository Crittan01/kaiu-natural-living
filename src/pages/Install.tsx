import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Download, Check, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <Layout>
      <section className="section-padding min-h-[60vh] flex items-center">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary to-kaiu-forest-light flex items-center justify-center shadow-card">
              {isInstalled ? (
                <Check className="w-10 h-10 text-primary-foreground" />
              ) : (
                <Smartphone className="w-10 h-10 text-primary-foreground" />
              )}
            </div>

            {isInstalled ? (
              <>
                <h1 className="font-display text-4xl font-bold text-foreground">
                  ¡Ya tienes Kaiu instalada!
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Abre la app desde tu pantalla de inicio para disfrutar de la
                  experiencia completa
                </p>
              </>
            ) : (
              <>
                <h1 className="font-display text-4xl font-bold text-foreground">
                  Instala Kaiu en tu dispositivo
                </h1>
                <p className="mt-4 text-lg text-muted-foreground">
                  Accede rápidamente a nuestro catálogo, rituales y ofertas
                  directamente desde tu pantalla de inicio
                </p>

                {/* Install Button or iOS Instructions */}
                {deferredPrompt ? (
                  <Button
                    variant="gold"
                    size="xl"
                    className="mt-8"
                    onClick={handleInstall}
                  >
                    <Download className="w-5 h-5" />
                    Instalar App
                  </Button>
                ) : isIOS ? (
                  <div className="mt-8 p-6 rounded-2xl bg-secondary border border-border text-left">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                      Instrucciones para iPhone/iPad
                    </h3>
                    <ol className="space-y-3 text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                          1
                        </span>
                        <span>
                          Toca el botón{' '}
                          <strong className="text-foreground">Compartir</strong> en la
                          barra inferior de Safari
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                          2
                        </span>
                        <span>
                          Desplázate hacia abajo y selecciona{' '}
                          <strong className="text-foreground">
                            Agregar a pantalla de inicio
                          </strong>
                        </span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium shrink-0">
                          3
                        </span>
                        <span>
                          Toca{' '}
                          <strong className="text-foreground">Agregar</strong> para
                          confirmar
                        </span>
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="mt-8 p-6 rounded-2xl bg-secondary border border-border">
                    <p className="text-muted-foreground">
                      Abre esta página en Chrome o Safari para instalar la app
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Benefits */}
            <div className="mt-12 grid grid-cols-3 gap-4">
              {[
                { label: 'Sin tienda', desc: 'Instalación directa' },
                { label: 'Offline', desc: 'Funciona sin internet' },
                { label: 'Rápida', desc: 'Acceso inmediato' },
              ].map((benefit) => (
                <div key={benefit.label} className="text-center">
                  <p className="font-display font-semibold text-foreground">
                    {benefit.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Install;
