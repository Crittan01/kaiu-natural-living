import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { mockFAQs } from '@/lib/data';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle, HelpCircle } from 'lucide-react';

const FAQ = () => {
  return (
    <Layout>
      <section className="section-padding">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center">
              <HelpCircle className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Preguntas Frecuentes
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Resolvemos tus dudas sobre nuestros productos y servicios
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {mockFAQs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-2xl border border-border px-6 shadow-soft"
                >
                  <AccordionTrigger className="text-left font-display text-lg font-semibold hover:no-underline hover:text-accent py-6">
                    {faq.pregunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                    {faq.respuesta}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 text-center p-8 rounded-3xl bg-secondary border border-border"
          >
            <h3 className="font-display text-2xl font-bold text-foreground">
              ¿No encontraste lo que buscabas?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Estamos aquí para ayudarte
            </p>
            <Button variant="whatsapp" size="lg" className="mt-6" asChild>
              <a
                href="https://wa.me/573125835649?text=¡Hola!%20Tengo%20una%20pregunta%20sobre%20los%20productos%20Kaiu"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5" />
                Escribir por WhatsApp
              </a>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
