import { VenndeloCarrier } from './providers/VenndeloCarrier.js';

class LogisticsManager {
    constructor() {
        this.providers = [
            new VenndeloCarrier()
            // Aquí agregaríamos new CoordinadoraCarrier(), etc.
        ];
    }

    /**
     * Encuentra la mejor cotización
     */
    async getBestQuote(origin, destination, items, paymentMethod) {
        const quotes = [];
        const errors = [];

        // Si es COD, Venndelo es la autoridad principal (por ahora)
        // Podríamos filtrar aquí si otras transportadoras no soportan COD
        const activeProviders = this.providers;

        for (const provider of activeProviders) {
            try {
                const quote = await provider.quote(origin, destination, items, paymentMethod);
                quotes.push(quote);
            } catch (error) {
                console.warn(`Error cotizando con ${provider.name}:`, error.message);
                errors.push({ provider: provider.name, error: error.message });
            }
        }

        if (quotes.length === 0) {
            throw new Error(`Ninguna transportadora disponible. Detalles: ${JSON.stringify(errors)}`);
        }

        // Estrategia: "Cheapest First"
        quotes.sort((a, b) => a.cost - b.cost);
        
        return quotes[0];
    }

    /**
     * Crea el envío con el proveedor seleccionado (por ahora default a Venndelo)
     * TODO: En el futuro, recibir 'carrierName' en orderData para elegir driver
     */
    async createShipment(orderData) {
        // Por defecto usamos Venndelo (primer provider)
        // Si tuviéramos lógica de selección, aquí elegiríamos el provider instance
        const provider = this.providers[0]; 
        
        console.log(`🚚 Creating shipment via ${provider.name}...`);
        return await provider.createShipment(orderData);
    }
    /**
     * Consulta el estado del envío en la transportadora correspondiente
     */
    async getShipmentStatus(carrierName, externalId) {
        // Find provider by name (case-insensitive) or default to first if not specified
        const provider = this.providers.find(p => p.name.toLowerCase() === (carrierName || 'venndelo').toLowerCase()) || this.providers[0];
        
        if (!provider) {
            console.warn(`Carrier not found: ${carrierName}`);
            return null;
        }

        if (provider.getShipmentStatus) {
            return await provider.getShipmentStatus(externalId);
        }
        
        return null;
    }
}

export default new LogisticsManager();
