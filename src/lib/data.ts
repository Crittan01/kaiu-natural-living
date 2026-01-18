import { Product, Ritual, FAQ } from './types';
import productLavanda from '@/assets/product-lavanda.jpg';
import productArgan from '@/assets/product-argan.jpg';
import productEucalipto from '@/assets/product-eucalipto.jpg';
import productJojoba from '@/assets/product-jojoba.jpg';
import ritualMorning from '@/assets/ritual-morning.jpg';

// Mock data - Replace with SheetDB API calls
export const mockProducts: Product[] = [
  {
    nombre: "Aceite Esencial de Lavanda",
    categoria: "Aceites Esenciales",
    beneficios: "relajación,sueño,calma",
    variantes: "10ml,30ml,100ml",
    imagen_url: productLavanda,
    enlace_ml: "https://bit.ly/kaiu-lavanda",
    descripcion: "Aceite 100% puro, ideal para difusores y masajes relajantes. Destilado de lavanda orgánica francesa."
  },
  {
    nombre: "Aceite Vegetal de Argán",
    categoria: "Aceites Vegetales",
    beneficios: "hidratación,cabello,piel",
    variantes: "30ml,100ml",
    imagen_url: productArgan,
    enlace_ml: "https://bit.ly/kaiu-argan",
    descripcion: "Rico en vitamina E, revitaliza piel y cabello. Prensado en frío de nueces de argán marroquí."
  },
  {
    nombre: "Aceite Esencial de Eucalipto",
    categoria: "Aceites Esenciales",
    beneficios: "respiración,frescura,energía",
    variantes: "10ml,30ml",
    imagen_url: productEucalipto,
    enlace_ml: "https://bit.ly/kaiu-eucalipto",
    descripcion: "Aceite purificante con aroma refrescante. Perfecto para limpiar el ambiente y despejar las vías respiratorias."
  },
  {
    nombre: "Aceite de Jojoba Dorado",
    categoria: "Aceites Vegetales",
    beneficios: "hidratación,antienvejecimiento,piel",
    variantes: "30ml,100ml",
    imagen_url: productJojoba,
    enlace_ml: "https://bit.ly/kaiu-jojoba",
    descripcion: "Aceite portador ideal para mezclar con esenciales. Nutre profundamente sin dejar sensación grasa."
  }
];

export const mockRituals: Ritual[] = [
  {
    titulo: "Ritual Matutino de Energía",
    resumen: "Comienza tu día con intención y vitalidad",
    contenido: "Despierta tu cuerpo y mente con este ritual de 5 minutos. Coloca 3 gotas de aceite de eucalipto en tu difusor mientras preparas tu espacio. Respira profundamente tres veces, sintiendo cómo el aroma fresco llena tus pulmones. Aplica una gota de aceite de menta diluido en tus sienes para despertar tus sentidos.",
    imagen_url: ritualMorning,
    productos_relacionados: "Aceite Esencial de Eucalipto"
  },
  {
    titulo: "Ritual de Relajación Nocturna",
    resumen: "Prepara cuerpo y mente para un sueño reparador",
    contenido: "Una hora antes de dormir, prepara tu espacio de descanso. Difunde 4 gotas de lavanda y 2 de manzanilla. Aplica unas gotas de aceite de jojoba mezclado con lavanda en tus muñecas. Realiza respiraciones profundas mientras visualizas paz y tranquilidad.",
    imagen_url: ritualMorning,
    productos_relacionados: "Aceite Esencial de Lavanda"
  },
  {
    titulo: "Ritual de Cuidado Capilar",
    resumen: "Nutre tu cabello con aceites naturales",
    contenido: "Calienta 2 cucharadas de aceite de argán entre tus palmas. Aplica desde medios hasta puntas en cabello seco. Masajea el cuero cabelludo con movimientos circulares durante 5 minutos. Deja actuar mínimo 30 minutos o toda la noche. Lava con tu shampoo habitual.",
    imagen_url: ritualMorning,
    productos_relacionados: "Aceite Vegetal de Argán"
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
    pregunta: "¿Realizan envíos a todo México?",
    respuesta: "Sí, realizamos envíos a toda la República Mexicana. Los tiempos de entrega varían según la zona, generalmente entre 3-7 días hábiles."
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

// API functions for SheetDB integration
const SHEETDB_BASE_URL = import.meta.env.VITE_SHEETDB_URL || '';

export async function fetchProducts(): Promise<Product[]> {
  if (!SHEETDB_BASE_URL) {
    return mockProducts;
  }
  
  try {
    const response = await fetch(`${SHEETDB_BASE_URL}?sheet=catalogo`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return mockProducts;
  }
}

export async function fetchRituals(): Promise<Ritual[]> {
  if (!SHEETDB_BASE_URL) {
    return mockRituals;
  }
  
  try {
    const response = await fetch(`${SHEETDB_BASE_URL}?sheet=rituales`);
    if (!response.ok) throw new Error('Failed to fetch rituals');
    return await response.json();
  } catch (error) {
    console.error('Error fetching rituals:', error);
    return mockRituals;
  }
}
