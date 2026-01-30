import { prisma } from '../../db.js';

export class InventoryService {
  /**
   * Valida si hay stock suficiente para una lista de items
   * @param {Array<{sku: string, quantity: number}>} items 
   * @returns {Promise<boolean>}
   */
  async checkStock(items) {
    const skus = items.map(i => i.sku);
    const products = await prisma.product.findMany({
      where: { sku: { in: skus } }
    });

    const productMap = new Map(products.map(p => [p.sku, p]));
    const errors = [];

    for (const item of items) {
      const product = productMap.get(item.sku);
      if (!product) {
        errors.push(`Producto no encontrado: ${item.sku}`);
        continue;
      }
      
      const available = product.stock - product.stockReserved;
      if (available < item.quantity) {
        errors.push(`Stock insuficiente para ${product.name} (Solicitado: ${item.quantity}, Disponible: ${available})`);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
    return true;
  }

  /**
   * Reserva stock temporalmente (Wompi pending)
   */
  async reserveStock(items) {
    // Primero validamos todo en bloque
    await this.checkStock(items);

    // Ejecutamos transacción para atomicidad
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { sku: item.sku },
          data: {
            stockReserved: { increment: item.quantity }
          }
        });
      }
    });
  }

  /**
   * Confirma la venta (Mueve de Reserved a Descontado Real)
   * Se llama cuando Wompi confirma pago o Venndelo crea orden COD
   */
  async confirmSale(items) {
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { sku: item.sku },
          data: {
            stockReserved: { decrement: item.quantity },
            stock: { decrement: item.quantity }
          }
        });
      }
    });
  }

  /**
   * Cancela reserva (Libera stock)
   * Se llama si Wompi rechaza o usuario cancela
   */
  async releaseReserve(items) {
    return await prisma.$transaction(async (tx) => {
      for (const item of items) {
        // Evitamos negativos por seguridad (aunque no debería pasar)
        // Prisma no tiene "decrement but floor at 0" nativo fácil en update, 
        // pero asumimos consistencia si el flujo es correcto.
        await tx.product.update({
          where: { sku: item.sku },
          data: {
            stockReserved: { decrement: item.quantity }
          }
        });
      }
    });
  }
}

export default new InventoryService();
