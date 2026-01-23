import { Product, Variant } from '@/lib/types';
import { createContext, useContext } from 'react';

export interface CartItem extends Product {
  quantity: number; // Cantidad seleccionada
  selectedVariant: Variant; // Objeto variante completo seleccionado
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: Variant, quantity?: number) => void;
  removeFromCart: (productId: number, variantId: string) => void;
  updateQuantity: (productId: number, variantId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

