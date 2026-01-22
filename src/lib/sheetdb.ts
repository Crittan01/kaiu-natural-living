import { Product, Variant } from './types';

// Interface matching the actual Excel columns (Spanish, Uppercase)
interface SheetRow {
  ID: string;
  SKU: string;           // "ACE-LAV-10ML"
  NOMBRE: string;        // "Aceite Esencial de Lavanda"
  CATEGORIA: string;     // "Aceites Esenciales"
  PRECIO: string;        // "23400" or empty
  PRECIO_ANTES: string;  // ""
  BENEFICIOS: string;
  DESCRIPCION_CORTA: string;
  DESCRIPCION_LARGA: string;
  INGREDIENTES: string;
  MODO_USO: string;
  TIPS: string;
  CERTIFICACIONES: string;
  IMAGEN_URL: string;
  VARIANTES: string;     // "5ml, 10ml, 30ml, 100ml"
  STOCK: string;         // "DISPONIBLE"
}

// Helper to convert Google Drive links to direct viewable links
const convertGoogleDriveLink = (url: string) => {
    if (!url) return '';
    
    // Check for standard Drive sharing links
    // 1. https://drive.google.com/file/d/ID/view...
    // 2. https://drive.google.com/open?id=ID
    // 3. https://drive.google.com/uc?id=ID
    
    // Robust Regex for ID extraction (alphanumeric + - _)
    // Matches ID in /d/ID, id=ID, etc.
    const idRegex = /(?:id=|\/d\/)([-\w]{25,})/;
    const match = url.match(idRegex);
    
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const id = match[1];
        // Use lh3.googleusercontent.com for reliable hotlinking (thumbnail generation) without API limits
        return `https://lh3.googleusercontent.com/d/${id}=s1000?authuser=0`;
    }
    
    return url;
};

export const fetchProductsFromSheet = async (sheetName?: string): Promise<Product[]> => {
  // Use local proxy to avoid CORS/SSL issues
  let PROXY_URL = '/api/products';
  
  if (sheetName) {
      PROXY_URL += `?sheet=${encodeURIComponent(sheetName)}`;
  }
  
  try {
    const response = await fetch(PROXY_URL);
    const rows: SheetRow[] = await response.json();

    // Group rows by "NOMBRE" to form a Product family
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
        const rowName = row.NOMBRE.trim();
        const rowPrice = parseInt(row.PRECIO) || 0;
        const oldPrice = row.PRECIO_ANTES ? parseInt(row.PRECIO_ANTES) : undefined;
        
        // Extract variant name: prefer the explicit VARIANTES column (e.g. "Roll-on 5ml"), 
        // fallback to SKU split if empty
        const skuParts = row.SKU.split('-');
        let variantName = row.VARIANTES?.trim();
        
        if (!variantName) {
            variantName = skuParts.length > 1 ? skuParts[skuParts.length - 1] : row.SKU;
        }

        if (!productMap.has(rowName)) {
            // Initialize Parent Product
            productMap.set(rowName, {
                id: parseInt(row.ID) || Math.random(), 
                nombre: rowName,
                categoria: row.CATEGORIA?.trim() || 'Sin Categoría',
                beneficios: row.BENEFICIOS,
                precio: rowPrice, // Will be overwritten by lowest price potentially, or first
                precio_antes: oldPrice,
                descripcion: row.DESCRIPCION_LARGA || row.DESCRIPCION_CORTA,
                imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
                enlace_ml: '', 
                variantes: []
            });
        }

        const product = productMap.get(rowName)!;
        
        // Only add variant if it has valid info (optional check)
        // Note: Row with empty price might be the "Master" description row, but in this sheet ID 1 is 5ML with no price.
        // We will add it anyway but maybe mark as unavailable if price is 0? 
        // For now, let's include everything.

        product.variantes.push({
            id: row.SKU, 
            nombre: variantName, // "10ML"
            precio: rowPrice,
            precio_antes: oldPrice,
            sku: row.SKU,
            imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
            stock: row.STOCK
        });

        // Update main product price to be the lowest non-zero price found so far (useful for "Desde $20.000")
        if (rowPrice > 0 && (product.precio === 0 || rowPrice < product.precio)) {
             product.precio = rowPrice;
        }
    });

    return Array.from(productMap.values());

  } catch (error) {
    console.error("❌ Error fetching SheetDB:", error);
    return [];
  }
};
