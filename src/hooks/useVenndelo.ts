import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  VenndeloProduct,
  Order,
  Inventory,
  Payment,
  VenndeloApiResponse,
  Product,
} from '@/lib/types';
import {
  fetchVenndeloProducts,
  fetchVenndeloProduct,
  createVenndeloProduct,
  updateVenndeloProduct,
  convertFromVenndeloProduct,
  createOrder,
  fetchOrders,
  fetchOrder,
  updateOrderStatus,
  cancelOrder,
  fetchInventory,
  updateInventory,
  createPayment,
  fetchPayment,
  isVenndeloConfigured,
} from '@/lib/venndelo';
import { mockProducts } from '@/lib/data';

/**
 * Hook to fetch products from Venndelo
 * Falls back to mock data if Venndelo is not configured
 */
export function useVenndeloProducts(page = 1, perPage = 50) {
  return useQuery({
    queryKey: ['venndelo-products', page, perPage],
    queryFn: async () => {
      if (!isVenndeloConfigured()) {
        // Return mock products if Venndelo is not configured
        return {
          success: true,
          data: mockProducts,
        } as VenndeloApiResponse<Product[]>;
      }

      const response = await fetchVenndeloProducts(page, perPage);
      
      if (!response.success || !response.data) {
        console.error('Failed to fetch Venndelo products:', response.error);
        // Fallback to mock data on error
        return {
          success: true,
          data: mockProducts,
        } as VenndeloApiResponse<Product[]>;
      }

      // Convert Venndelo products to our local format
      const products = response.data.map(convertFromVenndeloProduct);
      
      return {
        success: true,
        data: products,
        pagination: response.pagination,
      } as VenndeloApiResponse<Product[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

/**
 * Hook to fetch a single product from Venndelo
 */
export function useVenndeloProduct(productId: string) {
  return useQuery({
    queryKey: ['venndelo-product', productId],
    queryFn: async () => {
      if (!isVenndeloConfigured()) {
        const product = mockProducts.find(p => p.id === parseInt(productId));
        return {
          success: true,
          data: product,
        } as VenndeloApiResponse<Product>;
      }

      const response = await fetchVenndeloProduct(productId);
      
      if (!response.success || !response.data) {
        return response as VenndeloApiResponse<Product>;
      }

      return {
        success: true,
        data: convertFromVenndeloProduct(response.data),
      } as VenndeloApiResponse<Product>;
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new product in Venndelo
 */
export function useCreateVenndeloProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVenndeloProduct,
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['venndelo-products'] });
    },
  });
}

/**
 * Hook to update a product in Venndelo
 */
export function useUpdateVenndeloProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, updates }: { productId: string; updates: Partial<VenndeloProduct> }) =>
      updateVenndeloProduct(productId, updates),
    onSuccess: (data, variables) => {
      // Invalidate specific product and products list
      queryClient.invalidateQueries({ queryKey: ['venndelo-product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['venndelo-products'] });
    },
  });
}

/**
 * Hook to create an order in Venndelo
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: ['venndelo-orders'] });
    },
  });
}

/**
 * Hook to fetch orders from Venndelo
 */
export function useOrders(page = 1, perPage = 20, status?: Order['status']) {
  return useQuery({
    queryKey: ['venndelo-orders', page, perPage, status],
    queryFn: () => fetchOrders(page, perPage, status),
    enabled: isVenndeloConfigured(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch a single order
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['venndelo-order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId && isVenndeloConfigured(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: Order['status'] }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (data, variables) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['venndelo-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['venndelo-orders'] });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (data, orderId) => {
      // Invalidate specific order and orders list
      queryClient.invalidateQueries({ queryKey: ['venndelo-order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['venndelo-orders'] });
    },
  });
}

/**
 * Hook to fetch inventory for a product
 */
export function useInventory(productId: string, variantId?: string) {
  return useQuery({
    queryKey: ['venndelo-inventory', productId, variantId],
    queryFn: () => fetchInventory(productId, variantId),
    enabled: !!productId && isVenndeloConfigured(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to update inventory
 */
export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, stock, variantId }: { productId: string; stock: number; variantId?: string }) =>
      updateInventory(productId, stock, variantId),
    onSuccess: (data, variables) => {
      // Invalidate inventory cache
      queryClient.invalidateQueries({ 
        queryKey: ['venndelo-inventory', variables.productId, variables.variantId] 
      });
    },
  });
}

/**
 * Hook to create a payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Invalidate order if orderId is available
        queryClient.invalidateQueries({ 
          queryKey: ['venndelo-order', data.data.orderId] 
        });
      }
    },
  });
}

/**
 * Hook to fetch payment details
 */
export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ['venndelo-payment', paymentId],
    queryFn: () => fetchPayment(paymentId),
    enabled: !!paymentId && isVenndeloConfigured(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to check if Venndelo is configured
 */
export function useVenndeloConfig() {
  return {
    isConfigured: isVenndeloConfigured(),
  };
}
