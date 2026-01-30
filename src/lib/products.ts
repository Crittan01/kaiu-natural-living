import { Product, Variant } from './types';

// Interface matching the internal API response structure (originally based on SheetDB columns)
interface ProductRow {
  ID: string;            
  SKU: string;           
  NOMBRE: string;        
  CATEGORIA: string;     
  PRECIO: string;        
  PRECIO_ANTES: string;  
  BENEFICIOS: string;    
  DESCRIPCION_CORTA: string; 
  DESCRIPCION_LARGA: string; 
  INGREDIENTES: string;  
  MODO_USO: string;      
  TIPS: string;          
  CERTIFICACIONES: string; 
  IMAGEN_URL: string;    
  VARIANTES: string;     
  STOCK: string;         
  
  // Logistics
  PESO: string;          
  ALTO: string;          
  ANCHO: string;         
  LARGO: string;         
}

// Convert Google Drive links to direct image links
const convertGoogleDriveLink = (url: string) => {
    if (!url) return '';
    
    // 1. https://drive.google.com/file/d/ID/view...
    // 2. https://drive.google.com/open?id=ID
    // 3. https://drive.google.com/uc?id=ID
    
    const idRegex = /(?:id=|\/d\/)([-\w]{25,})/;
    const match = url.match(idRegex);
    
    if (match && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
        const id = match[1];
        return `https://lh3.googleusercontent.com/d/${id}=s1000?authuser=0`;
    }
    
    return url;
};

/**
 * Fetches products from the backend API (which wraps the Database)
 * @param sheetName Optional category filter (formerly sheet name)
 */
export const fetchProducts = async (categoryFilter?: string): Promise<Product[]> => {
  let API_URL = '/api/products';
  
  if (categoryFilter) {
      API_URL += `?sheet=${encodeURIComponent(categoryFilter)}`;
  }
  
  try {
    const response = await fetch(API_URL);
    // The API currently returns data in the legacy "SheetRow" format
    const rows: ProductRow[] = await response.json();

    // Group rows by "NOMBRE" to form Product families
    const productMap = new Map<string, Product>();

    rows.forEach(row => {
        const rowName = row.NOMBRE.trim();
        const rowPrice = parseInt(row.PRECIO) || 0;
        const oldPrice = row.PRECIO_ANTES ? parseInt(row.PRECIO_ANTES) : undefined;
        
        // Extract Variant Name from SKU or explicitly
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
                precio: rowPrice, 
                precio_antes: oldPrice,
                descripcion: row.DESCRIPCION_LARGA || row.DESCRIPCION_CORTA,
                imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
                enlace_ml: '', 
                variantes: []
            });
        }

        const product = productMap.get(rowName)!;
        
        // Add specific Variant
        product.variantes.push({
            id: row.SKU, 
            nombre: variantName, 
            precio: rowPrice,
            precio_antes: oldPrice,
            sku: row.SKU,
            imagen_url: convertGoogleDriveLink(row.IMAGEN_URL),
            stock: row.STOCK,
            // Logistics parsing
            peso: parseFloat((row.PESO || "0").replace(',', '.')) || 0,
            alto: parseFloat((row.ALTO || "0").replace(',', '.')) || 0,
            ancho: parseFloat((row.ANCHO || "0").replace(',', '.')) || 0,
            largo: parseFloat((row.LARGO || "0").replace(',', '.')) || 0
        });

        // Update "From" price
        if (rowPrice > 0 && (product.precio === 0 || rowPrice < product.precio)) {
             product.precio = rowPrice;
        }
    });

    return Array.from(productMap.values());

  } catch (error) {
    console.error("Error fetching products from API:", error);
    return [];
  }
};
