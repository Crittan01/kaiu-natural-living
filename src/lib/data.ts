import { Product, Ritual, FAQ } from './types';
import productLavanda from '@/assets/product-lavanda.jpg';
import productArgan from '@/assets/product-argan.jpg';
import productEucalipto from '@/assets/product-eucalipto.jpg';
import productJojoba from '@/assets/product-jojoba.jpg';
import ritualMorning from '@/assets/ritual-morning.jpg';

// Mock data - Replace with SheetDB API calls
export const mockProducts: Product[] = [];

export const mockRituals: Ritual[] = [
  {
    titulo: "Ritual Matutino de Energía",
    resumen: "Comienza tu día con intención y vitalidad",
    contenido: "Despierta tu cuerpo y mente con este ritual de 5 minutos. Coloca 3 gotas de aceite de eucalipto en tu difusor mientras preparas tu espacio. Respira profundamente tres veces, sintiendo cómo el aroma fresco llena tus pulmones. Aplica una gota de aceite de menta diluido en tus sienes para despertar tus sentidos.",
    imagen_url: ritualMorning,
    productos_relacionados: ["Aceite Esencial de Eucalipto"],
    tags: ["Energía", "Mañana", "Respiración"]
  },
  {
    titulo: "Ritual de Relajación Nocturna",
    resumen: "Prepara cuerpo y mente para un sueño reparador",
    contenido: "Una hora antes de dormir, prepara tu espacio de descanso. Difunde 4 gotas de lavanda y 2 de manzanilla. Aplica unas gotas de aceite de jojoba mezclado con lavanda en tus muñecas. Realiza respiraciones profundas mientras visualizas paz y tranquilidad.",
    imagen_url: ritualMorning,
    productos_relacionados: ["Aceite Esencial de Lavanda", "Aceite de Jojoba Dorado"],
    tags: ["Sueño", "Relajación", "Noche"]
  },
  {
    titulo: "Ritual de Cuidado Capilar",
    resumen: "Nutre tu cabello con aceites naturales",
    contenido: "Calienta 2 cucharadas de aceite de argán entre tus palmas. Aplica desde medios hasta puntas en cabello seco. Masajea el cuero cabelludo con movimientos circulares durante 5 minutos. Deja actuar mínimo 30 minutos o toda la noche. Lava con tu shampoo habitual.",
    imagen_url: ritualMorning,
    productos_relacionados: ["Aceite Vegetal de Argán"],
    tags: ["Cabello", "Nutrición", "Belleza"]
  }
];

export const mockFAQs: FAQ[] = [
  {
    pregunta: "¿Cómo usar aceites esenciales de forma segura?",
    respuesta: "Nunca apliques aceites esenciales puros directamente sobre la piel. Siempre dilúyelos en un aceite portador como jojoba o argán. La proporción recomendada es 2-3 gotas de esencial por cada cucharada de aceite portador."
  },
  {
    pregunta: "¿Cuál es la diferencia entre aceites esenciales y vegetales?",
    respuesta: "Los aceites esenciales son extractos concentrados de plantas con propiedades aromáticas y terapéuticas. Los aceites vegetales son grasas prensadas de semillas o nueces, usados como base para diluir esenciales o como hidratantes."
  },
  {
    pregunta: "¿Realizan envíos a todo Colombia?",
    respuesta: "Sí, realizamos envíos a toda Colombia. Los tiempos de entrega varían según la zona, generalmente entre 3-7 días hábiles."
  },
  {
    pregunta: "¿Los productos son 100% naturales?",
    respuesta: "Todos nuestros aceites son 100% puros y naturales, sin aditivos químicos, parabenos ni fragancias sintéticas. Trabajamos con proveedores certificados que garantizan la calidad de cada producto."
  },
  {
    pregunta: "¿Cómo puedo realizar una compra?",
    respuesta: "Puedes comprar nuestros productos a través de WhatsApp o en nuestras tiendas de Mercado Libre. Toca el botón 'Pedir' en cualquier producto para iniciar tu pedido por WhatsApp, o 'Tienda' para ver el producto en Mercado Libre."
  },
  {
    pregunta: "¿Cuánto tiempo duran los aceites esenciales?",
    respuesta: "Los aceites esenciales tienen una vida útil de 1-3 años dependiendo del tipo. Los cítricos duran menos (1-2 años) mientras que los de madera pueden durar más. Almacénalos en lugar fresco, oscuro y bien cerrados."
  }
];


