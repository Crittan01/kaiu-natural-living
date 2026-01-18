export interface Product {
  nombre: string;
  categoria: string;
  beneficios: string;
  variantes: string;
  imagen_url: string;
  enlace_ml: string;
  descripcion: string;
}

export interface Ritual {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string;
  productos_relacionados: string;
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
}
