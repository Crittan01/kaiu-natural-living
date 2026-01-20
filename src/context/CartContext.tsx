import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Variant } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export interface CartItem extends Product {
  quantity: number;
  selectedVariant: Variant; // Store the full variant object
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant: Variant, quantity?: number) => void;
  removeFromCart: (productId: number, variantId: string) => void;
  updateQuantity: (productId: number, variantId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kaiu_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse cart from local storage');
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('kaiu_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, variant: Variant, quantity = 1) => {
    setItems((prev) => {
      // Find if item exists with SAME product ID AND same variant ID
      const existing = prev.find((item) => item.id === product.id && item.selectedVariant.id === variant.id);
      
      if (existing) {
        toast({
          title: "Carrito actualizado",
          description: `Se aumentó la cantidad de ${product.nombre} (${variant.nombre})`,
        });
        return prev.map((item) =>
          (item.id === product.id && item.selectedVariant.id === variant.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      toast({
        title: "Agregado al carrito",
        description: `${product.nombre} (${variant.nombre}) se agregó.`,
      });
      
      // Create new cart item with the selected variant
      return [...prev, { ...product, selectedVariant: variant, quantity }];
    });
  };

  const removeFromCart = (productId: number, variantId: string) => {
    setItems((prev) => prev.filter((item) => !(item.id === productId && item.selectedVariant.id === variantId)));
  };

  const updateQuantity = (productId: number, variantId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        (item.id === productId && item.selectedVariant.id === variantId) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Calculate total using the VARIANT price, not the base product price
  const cartTotal = items.reduce(
    (total, item) => total + item.selectedVariant.precio * item.quantity,
    0
  );

  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
