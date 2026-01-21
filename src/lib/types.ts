export interface Variant {
  id: string;
  nombre: string; // "10ml"
  precio: number;
  precio_antes?: number;
  sku: string;
  imagen_url?: string; // Optional variant-specific image
  stock?: string; // "DISPONIBLE" or "AGOTADO"
}

export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  beneficios: string;
  // Main/Default price for display "From $X" or default variant
  precio: number; 
  precio_antes?: number;
  variantes: Variant[]; // Array of structured objects
  imagen_url: string;
  enlace_ml: string;
  descripcion: string;
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
