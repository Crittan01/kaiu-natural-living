// Definición de Variante de Producto
export interface Variant {
  id: string;            // ID único de la variante (ej: SKU)
  nombre: string;        // Nombre visible de la opción (Ej: "10ml", "250g")
  precio: number;        // Precio específico de esta variación
  precio_antes?: number; // Precio anterior para mostrar oferta (tachado)
  sku: string;           // Código de inventario único
  imagen_url?: string;   // Imagen específica de la variante (opcional)
  stock?: string;        // Estado: "DISPONIBLE" o "AGOTADO"
  
  // Logística (Opcional, se usan defaults si faltan. Importante para envío)
  peso?: number;  // KG
  alto?: number;  // CM
  ancho?: number; // CM
  largo?: number; // CM
}

// Definición de Producto Principal
export interface Product {
  id: number;            // ID numérico del producto padre
  nombre: string;        // Nombre general del producto
  categoria: string;     // Categoría principal (Aceites, Kits, etc)
  beneficios: string;    // Texto descriptivo de beneficios
  // Precio Principal (se calcula dinámicamente como "Desde $X" basado en la variante más barata)
  precio: number; 
  precio_antes?: number; // Precio base anterior
  variantes: Variant[];  // Lista de todas las opciones de compra
  imagen_url: string;    // Imagen principal del producto
  enlace_ml: string;     // Link a MercadoLibre (si aplica)
  descripcion: string;   // Descripción detallada HTML o texto
}

export interface Ritual {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string;
  productos_relacionados: string[];
  tags: string[]; // For filtering (e.g., "Sueño", "Energía")
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
}
