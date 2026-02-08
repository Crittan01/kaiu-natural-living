/**
 * Interfaz base para Transportadoras
 */
export class BaseCarrier {
    constructor(name) {
      this.name = name;
    }
  
    /**
     * Cotiza el envío
     * @param {object} origin
     * @param {object} destination
     * @param {Array} items
     * @returns {Promise<{cost: number, days: number, carrier: string}>}
     */
    async quote(origin, destination, items) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Crea el envío (Genera Guía)
     * @param {object} orderData
     * @returns {Promise<{trackingNumber: string, url: string, carrier_id: string}>}
     */
    async createShipment(orderData) {
      throw new Error('Method not implemented');
    }
  
    /**
     * Cancela envío (Si aplica)
     */
    async cancelShipment(trackingNumber) {
        throw new Error('Method not implemented');
    }
  }
