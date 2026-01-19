import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

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
        title: "Agregado a Favoritos",
        description: `${product.nombre} se guardó en tu lista de deseos.`,
      });
    }
  };

  const removeFromWishlist = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    toast({
      title: "Eliminado de Favoritos",
      description: "El producto se eliminó de tu lista de deseos.",
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

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
