import { BaseCarrier } from './BaseCarrier.js';

export class VenndeloCarrier extends BaseCarrier {
    constructor() {
        super('Venndelo');
        this.apiKey = process.env.VENNDELO_API_KEY;
        this.baseUrl = 'https://api.venndelo.com/v1';
        
        // Configuración de Origen (Bodega) desde ENV
        this.pickupInfo = {
            contact_name: process.env.VENNDELO_PICKUP_NAME,
            contact_phone: process.env.VENNDELO_PICKUP_PHONE,
            address_1: process.env.VENNDELO_PICKUP_ADDRESS,
            city_code: process.env.VENNDELO_PICKUP_CITY_CODE,
            subdivision_code: process.env.VENNDELO_PICKUP_SUBDIVISION_CODE,
            country_code: process.env.VENNDELO_PICKUP_COUNTRY || "CO",
            postal_code: "" 
        };
    }

    /**
     * Cotiza el envío
     */
    async quote(origin, destination, items, paymentMethod = 'EXTERNAL_PAYMENT') {
        const payload = {
            pickup_info: this.pickupInfo,
            shipping_info: {
                city_code: destination.city_code,
                subdivision_code: destination.subdivision_code,
                country_code: "CO",
                postal_code: ""
            },
            line_items: items.map(item => ({
                sku: "GENERIC",
                name: "Producto",
                unit_price: item.unit_price,
                free_shipping: false,
                height: item.height || 10,
                width: item.width || 10,
                length: item.length || 10,
                dimensions_unit: "CM",
                weight: item.weight || 1,
                weight_unit: "KG",
                quantity: item.quantity
            })),
            payment_method_code: paymentMethod
        };

        const res = await fetch(`${this.baseUrl}/admin/orders/quotation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': this.apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Error cotizando con Venndelo');
        }

        return {
            cost: data.quoted_shipping_total || 0,
            days: 3, // Venndelo no siempre devuelve delivery_days en cotización simple, asumimos standard
            carrier: 'Venndelo',
            originalData: data
        };
    }

    /**
     * Crea la orden/guia en Venndelo
     */
    async createShipment(orderData) {
        // Aseguramos que pickup_info sea el nuestro
        orderData.pickup_info = this.pickupInfo;
        
        // Lógica específica de Venndelo para departamentos (Bogotá hack)
        if (orderData.shipping_info.city_code === '11001000' && orderData.shipping_info.subdivision_code === '25') {
            orderData.shipping_info.subdivision_code = '11';
        }

        // Ensure postal_code is present (Required by API)
        if (orderData.shipping_info && !orderData.shipping_info.postal_code) {
             orderData.shipping_info.postal_code = "";
        }

        let response = await this._sendOrder(orderData);
        
        // Manejo de Errores de Cobertura (Fallback)
        if (!response.ok) {
            const errorData = response.data;
            const errorString = JSON.stringify(errorData);
            
            if (this._isCoverageError(errorString)) {
                console.log("⚠️ Detectado error de cobertura Venndelo, intentando Fallback...");
                const retryOrder = this._applyCoverageFallback(orderData);
                if (retryOrder) {
                    response = await this._sendOrder(retryOrder);
                }
            }
        }

        if (!response.ok) {
            throw new Error(response.data.message || 'Error creando orden en Venndelo');
        }

        const finalOrder = response.data.data || response.data;
        // Normalizar respuesta (Venndelo a veces devuelve items array wrapper)
        const orderObj = (Array.isArray(finalOrder.items) && finalOrder.items.length > 0) ? finalOrder.items[0] : finalOrder;

        return {
            trackingNumber: orderObj.shipments?.[0]?.tracking_number || null,
            carrier_name: orderObj.shipments?.[0]?.carrier_name || 'Venndelo',
            external_id: String(orderObj.id),
            total: orderObj.total,
            shipping_cost: orderObj.shipping_total,
            raw_response: orderObj
        };
    }

    async _sendOrder(payload) {
        const res = await fetch(`${this.baseUrl}/admin/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Venndelo-Api-Key': this.apiKey
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return { ok: res.ok, data };
    }

    _isCoverageError(errorString) {
        return errorString.includes("Tarifa") || 
               errorString.includes("transporte") || 
               errorString.includes("APP_PUBLIC_ERROR");
    }

    _applyCoverageFallback(originalOrder) {
        const FALLBACK_CITIES = {
            "05": "05001000", // Antioquia -> Medellin
            "11": "11001000", // Bogota
            "25": "25001000", // Cundinamarca -> Agua de Dios (Cabecera)
            "54": "54001000", // Norte de Santander -> Cúcuta
            "76": "76001000", // Valle -> Cali
            "08": "08001000", // Atlantico -> Barranquilla
            "13": "13001000", // Bolivar -> Cartagena
        };

        const deptCode = originalOrder.shipping_info.subdivision_code;
        const fallbackCity = FALLBACK_CITIES[deptCode];

        if (fallbackCity && fallbackCity !== originalOrder.shipping_info.city_code) {
             const retryOrder = JSON.parse(JSON.stringify(originalOrder));
             const originalCity = retryOrder.shipping_info.city_code;
             retryOrder.shipping_info.address_1 = `DESTINO REAL COD-${originalCity} ${retryOrder.shipping_info.address_1}`;
             retryOrder.shipping_info.city_code = fallbackCity;
             return retryOrder;
        }
        return null;
    }

    async getShipmentStatus(externalId) {
        if (!externalId) return null;

        try {
            const res = await fetch(`${this.baseUrl}/admin/orders/${externalId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Venndelo-Api-Key': this.apiKey
                }
            });

            if (!res.ok) {
                console.warn(`Venndelo Status Error [${externalId}]:`, res.status);
                return null;
            }

            const data = await res.json();
            const venndeloStatus = data.status;

            // Map to Internal Status
            const STATUS_MAP = {
                'PENDING': 'PENDING',
                'READY': 'PICKUP_REQUESTED', // "Alistados" means Pickup Requested -> Waiting for Pickup
                'PREPARING': 'READY_TO_SHIP', // "Preparación" means label generated in Venndelo -> Ready for Pickup
                'SHIPPED': 'SHIPPED',
                'INCIDENT': 'SHIPPED', 
                'DELIVERED': 'DELIVERED',
                'RETURNED': 'RETURNED',
                'CANCELLED': 'CANCELLED'
            };

            return {
                status: STATUS_MAP[venndeloStatus] || venndeloStatus,
                originalStatus: venndeloStatus,
                trackingNumber: data.shipments?.[0]?.tracking_number
            };

        } catch (error) {
            console.error("Error fetching Venndelo status:", error);
            return null;
        }
    }
}
