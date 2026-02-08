import { prisma } from './db.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  try {
    const sheetName = req.query.sheet;
    
    // Build query filter based on Sheet name (if applicable, mapping sheets to categories or just ignoring)
    // For now, we return all active products. SheetDB relied on "Sheets" which we might map to Categories later.
    
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      }
    });

    // Map Prisma Model to Legacy SheetDB Format (Backward Compatibility)
    const legacyFormat = products.map(p => ({
      SKU: p.sku,
      NOMBRE: p.name,
      DESCRIPCION_LARGA: p.description,
      // Fallback description if needed
      DESCRIPCION_CORTA: p.description ? p.description.substring(0, 100) + '...' : '', 
      PRECIO: p.price.toString(), // Frontend expects string often from Sheets
      STOCK: p.stock > 0 ? 'DISPONIBLE' : 'AGOTADO',
      IMAGEN_URL: p.images.length > 0 ? p.images[0] : '', // Take first image
      CATEGORIA: p.category || 'General',
      BENEFICIOS: p.benefits || '',
      PESO: p.weight?.toString() || '0.2',
      ALTO: p.height?.toString() || '10',
      ANCHO: p.width?.toString() || '10',
      LARGO: p.length?.toString() || '10',
      VARIANT_NAME: p.variantName || '' // New field for explicit variant naming
    }));

    // Filter by 'sheet' param if it mimicked categories. 
    // If sheet=Kits, filtering by category 'Kits' roughly.
    // SheetDB logic was distinct sheets. Here we can simulate if needed, or just return all for now.
    
    let result = legacyFormat;
    
    // Simple mock filter if specific sheet requested (optional refinement)
    if (sheetName && sheetName !== 'Productos') {
         result = legacyFormat.filter(p => p.CATEGORIA?.includes(sheetName) || p.NOMBRE?.includes(sheetName));
    }

    res.status(200).json(result);

  } catch (error) {
    console.error("DB ERROR:", error);
    res.status(500).json({ error: 'Failed to fetch products from DB', details: error.message });
  }
}
