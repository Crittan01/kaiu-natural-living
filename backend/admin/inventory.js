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
  
  else if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const { sku, updates } = req.body;
      
      if (!sku || !updates) {
          return res.status(400).json({ error: 'Missing SKU or updates' });
      }

      // Allowed fields to update
      const { price, stock, isActive } = updates;
      
      const dataToUpdate = {};
      if (typeof price !== 'undefined') dataToUpdate.price = Number(price);
      if (typeof stock !== 'undefined') dataToUpdate.stock = Number(stock);
      if (typeof isActive !== 'undefined') dataToUpdate.isActive = Boolean(isActive);

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
