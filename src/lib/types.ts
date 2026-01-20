export interface Product {
  id: number;
  nombre: string;
  categoria: string;
  beneficios: string;
  variantes: string;
  imagen_url: string;
  enlace_ml: string;
  descripcion: string;
}

export interface Ritual {
  titulo: string;
  resumen: string;
  contenido: string;
  imagen_url: string;
  productos_relacionados: string;
}

export interface FAQ {
  pregunta: string;
  respuesta: string;
}

// Venndelo API Types
export interface VenndeloProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  variants?: ProductVariant[];
  stock: number;
  sku: string;
  status: 'active' | 'inactive' | 'draft';
  metadata?: Record<string, unknown>;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  attributes: Record<string, string>;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Order {
  id?: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inventory {
  productId: string;
  variantId?: string;
  stock: number;
  reserved: number;
  available: number;
  lowStockThreshold?: number;
}

export interface Payment {
  id?: string;
  orderId: string;
  amount: number;
  currency: string;
  method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'mercadopago' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface VenndeloApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
}
