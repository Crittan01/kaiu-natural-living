import { prisma } from '../db.js';
import { verifyAdminToken } from './auth-helper.js';

export default async function handler(req, res) {
  // 1. Verify Auth
  const user = verifyAdminToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Handle Methods
  if (req.method === 'GET') {
    try {
      // Fetch ALL products (ordered by name, then variant)
      const products = await prisma.product.findMany({
        orderBy: [
            { name: 'asc' },
            { variantName: 'asc' } // Ensure variants group nicely
        ]
      });
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { sku, name, description, variantName, category, price, stock, isActive, benefits, weight, width, height, length, images } = req.body;
      
      if (!name || price === undefined) {
          return res.status(400).json({ error: 'Name and price are required' });
      }

      const safeSku = sku || `KAIU-${Date.now().toString(36).toUpperCase()}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + safeSku.toLowerCase();

      const newProduct = await prisma.product.create({
        data: {
          sku: safeSku,
          name: String(name),
          slug,
          description: description ? String(description) : '',
          variantName: variantName ? String(variantName) : null,
          category: category ? String(category) : 'Otros',
          price: Number(price),
          stock: Number(stock || 0),
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          images: Array.isArray(images) ? images : [],
          benefits: benefits ? String(benefits) : null,
          weight: weight !== undefined ? Number(weight) : 0.2,
          width: width !== undefined ? Number(width) : 10,
          height: height !== undefined ? Number(height) : 10,
          length: length !== undefined ? Number(length) : 10
        }
      });

      return res.status(201).json({ success: true, product: newProduct });

    } catch (error) {
      console.error('Error creating product:', error);
      return res.status(500).json({ error: 'Failed to create product' });
    }
  }

  else if (req.method === 'PUT') {
    try {
      const { sku, updates } = req.body;
      
      if (!sku || !updates) {
          return res.status(400).json({ error: 'Missing SKU or updates' });
      }

      // Allowed fields to update
      const { price, stock, isActive, name, description, category, variantName, benefits, weight, width, height, length, images } = updates;
      
      const dataToUpdate = {};
      if (typeof price !== 'undefined') dataToUpdate.price = Number(price);
      if (typeof stock !== 'undefined') dataToUpdate.stock = Number(stock);
      if (typeof isActive !== 'undefined') dataToUpdate.isActive = Boolean(isActive);
      if (typeof name !== 'undefined') dataToUpdate.name = String(name);
      if (typeof description !== 'undefined') dataToUpdate.description = String(description);
      if (typeof category !== 'undefined') dataToUpdate.category = String(category);
      if (typeof variantName !== 'undefined') dataToUpdate.variantName = String(variantName);
      if (typeof benefits !== 'undefined') dataToUpdate.benefits = benefits ? String(benefits) : null;
      if (typeof weight !== 'undefined') dataToUpdate.weight = Number(weight);
      if (typeof width !== 'undefined') dataToUpdate.width = Number(width);
      if (typeof height !== 'undefined') dataToUpdate.height = Number(height);
      if (typeof length !== 'undefined') dataToUpdate.length = Number(length);
      if (typeof images !== 'undefined' && Array.isArray(images)) dataToUpdate.images = images;

      const updatedProduct = await prisma.product.update({
        where: { sku: sku },
        data: dataToUpdate
      });

      return res.status(200).json({ success: true, product: updatedProduct });

    } catch (error) {
      console.error('Error updating inventory:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
