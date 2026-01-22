import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Variant } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

export interface CartItem extends Product {
  quantity: number; // Cantidad seleccionada
  selectedVariant: Variant; // Objeto variante completo seleccionado
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

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const saved = localStorage.getItem('kaiu_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (error) {
        console.error('Fallo al leer carrito desde local storage');
      }
    }
  }, []);

  // Guardar en localStorage cuando cambian los items
  useEffect(() => {
    localStorage.setItem('kaiu_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, variant: Variant, quantity = 1) => {
    setItems((prev) => {
      // Buscar si el item ya existe con el MISMO ID de producto Y variante
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
      
      // Crear nuevo item de carrito con la variante seleccionada
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

  // Calcular total usando el precio de la VARIANTE, no del producto base
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
