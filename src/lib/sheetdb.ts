import { Product, Variant } from './types';

// Interfaz que coincide con las columnas exactas del Excel (En Español y Mayúsculas)
interface SheetRow {
  ID: string;            // Identificador único (aunque usamos SKU mayormente)
  SKU: string;           // Código de producto (Ej: "ACE-LAV-10ML")
  NOMBRE: string;        // Nombre del producto (Ej: "Aceite Esencial de Lavanda")
  CATEGORIA: string;     // Categoría para filtros (Ej: "Aceites Esenciales", "Kits")
  PRECIO: string;        // Precio actual (Ej: "23400")
  PRECIO_ANTES: string;  // Precio tachado oferta (Opcional, Ej: "28000")
  BENEFICIOS: string;    // Texto de beneficios principales
  DESCRIPCION_CORTA: string; // Resumen para tarjeta de producto
  DESCRIPCION_LARGA: string; // Detalle completo para página de producto
  INGREDIENTES: string;  // Lista de componentes
  MODO_USO: string;      // Instrucciones de aplicación
  TIPS: string;          // Consejos adicionales
  CERTIFICACIONES: string; // Sellos de calidad o info extra
  IMAGEN_URL: string;    // Enlace a imagen (Google Drive o Directa)
  VARIANTES: string;     // Variaciones explícitas (Ej: "5ml, 10ml")
  STOCK: string;         // Estado de inventario ("DISPONIBLE" / "AGOTADO")
  
  // Nuevas Columnas de Logística (Requeridas para cálculo de envío preciso)
  PESO: string;          // Peso en Kilogramos (Ej: "0.2")
  ALTO: string;          // Altura en CM (Ej: "10")
  ANCHO: string;         // Ancho en CM (Ej: "10")
  LARGO: string;         // Largo en CM (Ej: "10")
}

// Helper para convertir links de Google Drive a links directos de imagen
// Esto evita problemas de permisos estrictos y cuotas de API
const convertGoogleDriveLink = (url: string) => {
    if (!url) return '';
    
    // Detectar enlaces de compartir estándar
    // 1. https://drive.google.com/file/d/ID/view...
    // 2. https://drive.google.com/open?id=ID
    // 3. https://drive.google.com/uc?id=ID
    
    // Regex robusta para extraer el ID del archivo
    const idRegex = /(?:id=|\/d\/)([-\w]{25,})/;
    const match = url.match(idRegex);
    
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const id = match[1];
        // Usamos lh3.googleusercontent.com que es más permisivo con hotlinking y permite redimensionar
        return `https://lh3.googleusercontent.com/d/${id}=s1000?authuser=0`;
    }
    
    return url;
};

export const fetchProductsFromSheet = async (sheetName?: string): Promise<Product[]> => {
  // Usamos el proxy local (/api/products) para evitar errores de CORS con SheetDB directo
  let PROXY_URL = '/api/products';
  
  if (sheetName) {
      PROXY_URL += `?sheet=${encodeURIComponent(sheetName)}`;
  }
  
  try {
    const response = await fetch(PROXY_URL);
    const rows: SheetRow[] = await response.json();

    // Agrupamos filas por "NOMBRE" para formar familias de Productos
    // (Ej: "Aceite Lavanda" padre con variantes "10ml", "30ml")
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
        const rowName = row.NOMBRE.trim();
        const rowPrice = parseInt(row.PRECIO) || 0;
        const oldPrice = row.PRECIO_ANTES ? parseInt(row.PRECIO_ANTES) : undefined;
        
        // Extraer nombre de variante:
        // 1. Columna explícita "VARIANTES" (Ej: "Roll-on 5ml")
        // 2. Fallback de SKU (Ej: "ACE-LAV-10ML" -> "10ML")
        const skuParts = row.SKU.split('-');
        let variantName = row.VARIANTES?.trim();
        
        if (!variantName) {
            variantName = skuParts.length > 1 ? skuParts[skuParts.length - 1] : row.SKU;
        }

        if (!productMap.has(rowName)) {
            // Inicializar Producto Padre si no existe
            productMap.set(rowName, {
                id: parseInt(row.ID) || Math.random(), 
                nombre: rowName,
                categoria: row.CATEGORIA?.trim() || 'Sin Categoría',
                beneficios: row.BENEFICIOS,
                precio: rowPrice, // Precio base (se actualizará con el menor encontrado)
                precio_antes: oldPrice,
                descripcion: row.DESCRIPCION_LARGA || row.DESCRIPCION_CORTA,
                imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
                enlace_ml: '', 
                variantes: []
            });
        }

        const product = productMap.get(rowName)!;
        
        // Agregamos la variante específica (SKU) al padre
        product.variantes.push({
            id: row.SKU, 
            nombre: variantName, // Ej: "10ML"
            precio: rowPrice,
            precio_antes: oldPrice,
            sku: row.SKU,
            imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
            stock: row.STOCK,
            // Parsing de Logística (Manejar decimales con coma o punto)
            peso: parseFloat((row.PESO || "0").replace(',', '.')) || 0,
            alto: parseFloat((row.ALTO || "0").replace(',', '.')) || 0,
            ancho: parseFloat((row.ANCHO || "0").replace(',', '.')) || 0,
            largo: parseFloat((row.LARGO || "0").replace(',', '.')) || 0
        });

        // Actualizamos el precio del padre para mostrar "Desde $X" (el menor precio disponible)
        if (rowPrice > 0 && (product.precio === 0 || rowPrice < product.precio)) {
             product.precio = rowPrice;
        }
    });

    return Array.from(productMap.values());

  } catch (error) {
    console.error("Error obteniendo datos de SheetDB:", error);
    return [];
  }
};
