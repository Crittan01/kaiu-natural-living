import React, { useState, useEffect, ReactNode } from 'react';
import { Product, Variant } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { CartContext, CartItem, CartContextType } from './CartContextDef';

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
          description: `+${quantity} ${product.nombre} (${variant.nombre}) actualizados.`,
          duration: 1500,
        });
        return prev.map((item) =>
          (item.id === product.id && item.selectedVariant.id === variant.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      toast({
        description: `${product.nombre} (${variant.nombre}) en carrito.`,
        duration: 1500,
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


