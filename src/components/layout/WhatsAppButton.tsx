import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  message?: string;
  phone?: string;
}

export function WhatsAppButton({ 
  message = "¡Hola! Estoy desde la app de Kaiu. ¿En qué puedo ayudarte?",
  phone = "521234567890"
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-fab"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" fill="currentColor" />
    </motion.a>
  );
}
