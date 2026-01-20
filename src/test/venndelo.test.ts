import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isVenndeloConfigured,
  getVenndeloConfig,
  convertToVenndeloProduct,
  convertFromVenndeloProduct,
} from '@/lib/venndelo';
import type { Product, VenndeloProduct } from '@/lib/types';

describe('Venndelo API Configuration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    vi.stubEnv('VITE_VENNDELO_API_KEY', '');
    vi.stubEnv('VITE_VENNDELO_STORE_ID', '');
  });

  it('should detect when Venndelo is not configured', () => {
    const isConfigured = isVenndeloConfigured();
    expect(isConfigured).toBe(false);
  });

  it('should return configuration status', () => {
    const config = getVenndeloConfig();
    expect(config).toHaveProperty('baseUrl');
    expect(config).toHaveProperty('hasApiKey');
    expect(config).toHaveProperty('hasStoreId');
    expect(config).toHaveProperty('isConfigured');
  });

  it('should have default base URL', () => {
    const config = getVenndeloConfig();
    expect(config.baseUrl).toContain('venndelo.com');
  });
});

describe('Product Conversion', () => {
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

  const mockVenndeloProduct: VenndeloProduct = {
    id: '1',
    name: 'Aceite de Lavanda',
    description: 'Aceite puro de lavanda',
    price: 50000,
    currency: 'COP',
    category: 'Aceites Esenciales',
    images: ['https://example.com/lavanda.jpg'],
    stock: 10,
    sku: 'KAIU-1',
    status: 'active',
    metadata: {
      beneficios: 'relajación,sueño',
      variantes: '10ml,30ml',
      enlace_ml: 'https://bit.ly/lavanda',
      original_id: 1,
    },
  };

  it('should convert Product to VenndeloProduct format', () => {
    const result = convertToVenndeloProduct(mockProduct);

    expect(result.name).toBe(mockProduct.nombre);
    expect(result.description).toBe(mockProduct.descripcion);
    expect(result.category).toBe(mockProduct.categoria);
    expect(result.sku).toBe('KAIU-1');
    expect(result.images).toContain(mockProduct.imagen_url);
    expect(result.status).toBe('active');
    expect(result.metadata?.beneficios).toBe(mockProduct.beneficios);
  });

  it('should convert VenndeloProduct to Product format', () => {
    const result = convertFromVenndeloProduct(mockVenndeloProduct);

    expect(result.id).toBe(1);
    expect(result.nombre).toBe(mockVenndeloProduct.name);
    expect(result.descripcion).toBe(mockVenndeloProduct.description);
    expect(result.categoria).toBe(mockVenndeloProduct.category);
    expect(result.beneficios).toBe('relajación,sueño');
    expect(result.variantes).toBe('10ml,30ml');
    expect(result.imagen_url).toBe(mockVenndeloProduct.images[0]);
  });

  it('should handle VenndeloProduct without metadata', () => {
    const venndeloWithoutMetadata: VenndeloProduct = {
      ...mockVenndeloProduct,
      metadata: undefined,
    };

    const result = convertFromVenndeloProduct(venndeloWithoutMetadata);

    expect(result.beneficios).toBe('');
    expect(result.variantes).toBe('');
    expect(result.enlace_ml).toBe('');
  });

  it('should preserve product ID through conversion cycle', () => {
    const venndeloProduct = convertToVenndeloProduct(mockProduct);
    const backToProduct = convertFromVenndeloProduct({
      ...mockVenndeloProduct,
      ...venndeloProduct,
    });

    expect(backToProduct.id).toBe(mockProduct.id);
  });
});

describe('API Response Types', () => {
  it('should handle successful API response', () => {
    const successResponse = {
      success: true,
      data: { id: '1', name: 'Test Product' },
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBeDefined();
    expect(successResponse.error).toBeUndefined();
  });

  it('should handle error API response', () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Product not found',
      },
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBeDefined();
    expect(errorResponse.error?.code).toBe('NOT_FOUND');
  });
});
