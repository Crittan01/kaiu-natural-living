import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/context/CartContext';
import type { Product } from '@/lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('CartContext', () => {
  const mockProduct: Product = {
    id: 1,
    nombre: 'Aceite de Lavanda',
    categoria: 'Aceites Esenciales',
    beneficios: 'relajación,sueño',
    variantes: '10ml,30ml',
    imagen_url: 'https://example.com/lavanda.jpg',
    enlace_ml: 'https://bit.ly/lavanda',
    descripcion: 'Aceite puro de lavanda',
  };

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.getItemCount()).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe(mockProduct.id);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.getItemCount()).toBe(2);
  });

  it('should increment quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 1);
      result.current.addItem(mockProduct, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.getItemCount()).toBe(3);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.removeItem(mockProduct.id);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.getItemCount()).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.updateQuantity(mockProduct.id, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.getItemCount()).toBe(5);
  });

  it('should remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.updateQuantity(mockProduct.id, 0);
    });

    expect(result.current.items).toEqual([]);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.getItemCount()).toBe(0);
  });

  it('should handle multiple different items', () => {
    const product2: Product = {
      ...mockProduct,
      id: 2,
      nombre: 'Aceite de Eucalipto',
    };

    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.addItem(product2, 3);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.getItemCount()).toBe(5);
  });

  it('should persist cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 2);
    });

    const stored = localStorage.getItem('kaiu-cart');
    expect(stored).toBeDefined();
    
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].product.id).toBe(mockProduct.id);
    expect(parsed[0].quantity).toBe(2);
  });

  it('should handle variants separately', () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem(mockProduct, 1, 'variant-10ml');
      result.current.addItem(mockProduct, 2, 'variant-30ml');
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.getItemCount()).toBe(3);
  });
});
