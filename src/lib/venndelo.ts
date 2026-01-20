import type {
  VenndeloProduct,
  Order,
  Inventory,
  Payment,
  VenndeloApiResponse,
  Product,
} from './types';

// Configuration
const VENNDELO_BASE_URL = import.meta.env.VITE_VENNDELO_URL || 'https://api.venndelo.com/v1';
const VENNDELO_API_KEY = import.meta.env.VITE_VENNDELO_API_KEY || '';
const VENNDELO_STORE_ID = import.meta.env.VITE_VENNDELO_STORE_ID || '';

// Request configuration
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * Base fetch wrapper with authentication and error handling
 */
async function venndeloFetch<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<VenndeloApiResponse<T>> {
  const { params, ...fetchConfig } = config;

  // Build URL with query parameters
  const url = new URL(`${VENNDELO_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VENNDELO_API_KEY}`,
    'X-Store-Id': VENNDELO_STORE_ID,
    ...fetchConfig.headers,
  };

  try {
    const response = await fetch(url.toString(), {
      ...fetchConfig,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code || `HTTP_${response.status}`,
          message: data.error?.message || response.statusText,
          details: data.error?.details,
        },
      };
    }

    return {
      success: true,
      data: data.data || data,
      pagination: data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Products API
 */

/**
 * Fetch all products from Venndelo
 */
export async function fetchVenndeloProducts(
  page = 1,
  perPage = 50
): Promise<VenndeloApiResponse<VenndeloProduct[]>> {
  return venndeloFetch<VenndeloProduct[]>('/products', {
    params: { page, per_page: perPage, status: 'active' },
  });
}

/**
 * Fetch a single product by ID
 */
export async function fetchVenndeloProduct(
  productId: string
): Promise<VenndeloApiResponse<VenndeloProduct>> {
  return venndeloFetch<VenndeloProduct>(`/products/${productId}`);
}

/**
 * Create a new product in Venndelo
 */
export async function createVenndeloProduct(
  product: Partial<VenndeloProduct>
): Promise<VenndeloApiResponse<VenndeloProduct>> {
  return venndeloFetch<VenndeloProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

/**
 * Update a product in Venndelo
 */
export async function updateVenndeloProduct(
  productId: string,
  updates: Partial<VenndeloProduct>
): Promise<VenndeloApiResponse<VenndeloProduct>> {
  return venndeloFetch<VenndeloProduct>(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Sync local products with Venndelo
 * Converts our Product type to VenndeloProduct format
 */
export function convertToVenndeloProduct(product: Product): Partial<VenndeloProduct> {
  return {
    name: product.nombre,
    description: product.descripcion,
    category: product.categoria,
    sku: `KAIU-${product.id}`,
    images: [product.imagen_url],
    status: 'active',
    metadata: {
      beneficios: product.beneficios,
      variantes: product.variantes,
      enlace_ml: product.enlace_ml,
      original_id: product.id,
    },
  };
}

/**
 * Convert Venndelo product to our local Product format
 */
export function convertFromVenndeloProduct(venndeloProduct: VenndeloProduct): Product {
  return {
    id: venndeloProduct.metadata?.original_id || parseInt(venndeloProduct.id),
    nombre: venndeloProduct.name,
    categoria: venndeloProduct.category,
    beneficios: venndeloProduct.metadata?.beneficios || '',
    variantes: venndeloProduct.metadata?.variantes || '',
    imagen_url: venndeloProduct.images[0] || '',
    enlace_ml: venndeloProduct.metadata?.enlace_ml || '',
    descripcion: venndeloProduct.description,
  };
}

/**
 * Orders API
 */

/**
 * Create a new order in Venndelo
 */
export async function createOrder(order: Order): Promise<VenndeloApiResponse<Order>> {
  return venndeloFetch<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

/**
 * Fetch all orders
 */
export async function fetchOrders(
  page = 1,
  perPage = 20,
  status?: Order['status']
): Promise<VenndeloApiResponse<Order[]>> {
  const params: Record<string, string | number> = { page, per_page: perPage };
  if (status) params.status = status;

  return venndeloFetch<Order[]>('/orders', { params });
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrder(orderId: string): Promise<VenndeloApiResponse<Order>> {
  return venndeloFetch<Order>(`/orders/${orderId}`);
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status']
): Promise<VenndeloApiResponse<Order>> {
  return venndeloFetch<Order>(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Cancel an order
 */
export async function cancelOrder(orderId: string): Promise<VenndeloApiResponse<Order>> {
  return updateOrderStatus(orderId, 'cancelled');
}

/**
 * Inventory API
 */

/**
 * Fetch inventory for a product
 */
export async function fetchInventory(
  productId: string,
  variantId?: string
): Promise<VenndeloApiResponse<Inventory>> {
  const endpoint = variantId
    ? `/inventory/${productId}/variants/${variantId}`
    : `/inventory/${productId}`;
  
  return venndeloFetch<Inventory>(endpoint);
}

/**
 * Update inventory stock
 */
export async function updateInventory(
  productId: string,
  stock: number,
  variantId?: string
): Promise<VenndeloApiResponse<Inventory>> {
  const endpoint = variantId
    ? `/inventory/${productId}/variants/${variantId}`
    : `/inventory/${productId}`;
  
  return venndeloFetch<Inventory>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify({ stock }),
  });
}

/**
 * Fetch all low stock items
 */
export async function fetchLowStockItems(): Promise<VenndeloApiResponse<Inventory[]>> {
  return venndeloFetch<Inventory[]>('/inventory/low-stock');
}

/**
 * Payment API
 */

/**
 * Create a payment for an order
 */
export async function createPayment(payment: Payment): Promise<VenndeloApiResponse<Payment>> {
  return venndeloFetch<Payment>('/payments', {
    method: 'POST',
    body: JSON.stringify(payment),
  });
}

/**
 * Fetch payment details
 */
export async function fetchPayment(paymentId: string): Promise<VenndeloApiResponse<Payment>> {
  return venndeloFetch<Payment>(`/payments/${paymentId}`);
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: Payment['status']
): Promise<VenndeloApiResponse<Payment>> {
  return venndeloFetch<Payment>(`/payments/${paymentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Webhooks - Process incoming webhook events from Venndelo
 */
export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Verify webhook signature for security
 * @param payload - The raw request body as string
 * @param signature - The signature from the webhook header
 * @param secret - The webhook secret key
 * @returns boolean indicating if signature is valid
 * 
 * NOTE: This is a placeholder implementation. Actual implementation should:
 * 1. Use HMAC-SHA256 to compute expected signature
 * 2. Compare with provided signature using constant-time comparison
 * 3. Refer to Venndelo's webhook documentation for their specific algorithm
 * 
 * Example implementation (requires crypto library):
 * ```
 * import { createHmac, timingSafeEqual } from 'crypto';
 * 
 * const expectedSignature = createHmac('sha256', secret)
 *   .update(payload)
 *   .digest('hex');
 * 
 * return timingSafeEqual(
 *   Buffer.from(signature),
 *   Buffer.from(expectedSignature)
 * );
 * ```
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement proper HMAC-SHA256 signature verification
  // For now, reject all webhooks for security
  console.warn('Webhook signature verification not implemented - rejecting request');
  return false;
}

/**
 * Handle webhook events
 * 
 * NOTE: This is a placeholder implementation that only logs events.
 * Production implementation should:
 * 1. Invalidate React Query cache for affected resources
 * 2. Trigger notifications or alerts
 * 3. Update application state
 * 4. Handle error cases
 * 
 * Example production implementation:
 * ```
 * import { queryClient } from '@/App';
 * import { toast } from 'sonner';
 * 
 * switch (event.event) {
 *   case 'order.created':
 *     queryClient.invalidateQueries({ queryKey: ['venndelo-orders'] });
 *     toast.info('New order received');
 *     break;
 *   // ... handle other events
 * }
 * ```
 */
export async function handleWebhook(event: WebhookEvent): Promise<void> {
  // TODO: Implement proper webhook event handling
  // Current implementation only logs for development/debugging
  switch (event.event) {
    case 'order.created':
      console.log('Webhook: New order created:', event.data);
      break;
    case 'order.updated':
      console.log('Webhook: Order updated:', event.data);
      break;
    case 'payment.completed':
      console.log('Webhook: Payment completed:', event.data);
      break;
    case 'inventory.low_stock':
      console.log('Webhook: Low stock alert:', event.data);
      break;
    default:
      console.log('Webhook: Unknown event:', event.event);
  }
}

/**
 * Analytics and Reporting
 */

/**
 * Fetch sales analytics
 */
export async function fetchSalesAnalytics(
  startDate: string,
  endDate: string
): Promise<VenndeloApiResponse<Record<string, unknown>>> {
  return venndeloFetch('/analytics/sales', {
    params: { start_date: startDate, end_date: endDate },
  });
}

/**
 * Fetch product performance
 */
export async function fetchProductAnalytics(
  productId: string
): Promise<VenndeloApiResponse<Record<string, unknown>>> {
  return venndeloFetch(`/analytics/products/${productId}`);
}

/**
 * Utility Functions
 */

/**
 * Check if Venndelo API is properly configured
 */
export function isVenndeloConfigured(): boolean {
  return !!(VENNDELO_API_KEY && VENNDELO_STORE_ID);
}

/**
 * Get API configuration status for debugging
 */
export function getVenndeloConfig() {
  return {
    baseUrl: VENNDELO_BASE_URL,
    hasApiKey: !!VENNDELO_API_KEY,
    hasStoreId: !!VENNDELO_STORE_ID,
    isConfigured: isVenndeloConfigured(),
  };
}
