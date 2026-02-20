import React, { useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { WishlistContext, WishlistContextType } from './WishlistContextDef';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kaiu_wishlist');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse wishlist from local storage');
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('kaiu_wishlist', JSON.stringify(items));
  }, [items]);

  const addToWishlist = (product: Product) => {
    if (!isInWishlist(product.id)) {
      setItems((prev) => [...prev, product]);
      toast({
        description: `${product.nombre} se guardó en favoritos ❤`,
        duration: 1500,
      });
    }
  };

  const removeFromWishlist = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    toast({
      description: "Producto eliminado de favoritos.",
      duration: 1500,
    });
  };

  const isInWishlist = (productId: number) => {
    return items.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}


