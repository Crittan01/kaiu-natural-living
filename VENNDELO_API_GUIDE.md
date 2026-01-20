# Guía de Integración con la API de Venndelo

Este documento describe cómo aprovechar al máximo la integración con la API de Venndelo en el proyecto KAIU Natural Living.

## Índice

1. [Arquitectura de la Integración](#arquitectura-de-la-integración)
2. [Configuración Inicial](#configuración-inicial)
3. [Módulos Disponibles](#módulos-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Mejores Prácticas](#mejores-prácticas)
6. [Manejo de Errores](#manejo-de-errores)
7. [Optimización y Cache](#optimización-y-cache)

## Arquitectura de la Integración

### Estructura de Archivos

```
src/
├── lib/
│   ├── venndelo.ts          # Cliente de API de Venndelo
│   ├── types.ts              # Definiciones de tipos
│   └── data.ts               # Capa de datos con fallback
├── hooks/
│   └── useVenndelo.ts        # React hooks para Venndelo
├── context/
│   └── CartContext.tsx       # Context del carrito de compras
└── components/
    └── ...                   # Componentes de UI
```

### Flujo de Datos

```
Componente React
    ↓
React Hook (useVenndelo)
    ↓
React Query (cache + estado)
    ↓
Cliente Venndelo (venndelo.ts)
    ↓
API de Venndelo
    ↓
[Fallback: SheetDB → Mock Data]
```

## Configuración Inicial

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de Venndelo
VITE_VENNDELO_URL=https://api.venndelo.com/v1
VITE_VENNDELO_API_KEY=vnd_live_xxxxxxxxxxxxxxxx
VITE_VENNDELO_STORE_ID=store_xxxxxxxx
VITE_USE_VENNDELO=true

# Configuración opcional de SheetDB (fallback)
VITE_SHEETDB_URL=https://sheetdb.io/api/v1/xxxxx
```

### 2. Verificar Configuración

```typescript
import { getVenndeloConfig } from '@/lib/venndelo';

const config = getVenndeloConfig();
console.log(config);
// {
//   baseUrl: "https://api.venndelo.com/v1",
//   hasApiKey: true,
//   hasStoreId: true,
//   isConfigured: true
// }
```

## Módulos Disponibles

### 1. Productos

#### Listar Productos

```typescript
import { useVenndeloProducts } from '@/hooks/useVenndelo';

function ProductCatalog() {
  const { data, isLoading, error, refetch } = useVenndeloProducts(1, 50);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.data?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <button onClick={() => refetch()}>Actualizar</button>
    </div>
  );
}
```

#### Obtener Producto Individual

```typescript
import { useVenndeloProduct } from '@/hooks/useVenndelo';

function ProductDetail({ productId }: { productId: string }) {
  const { data, isLoading } = useVenndeloProduct(productId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>{data?.data?.nombre}</h1>
      <p>{data?.data?.descripcion}</p>
      <p>Precio: ${data?.data?.price}</p>
    </div>
  );
}
```

#### Crear Producto

```typescript
import { useCreateVenndeloProduct } from '@/hooks/useVenndelo';
import { toast } from 'sonner';

function ProductForm() {
  const createProduct = useCreateVenndeloProduct();

  const handleSubmit = async (formData: any) => {
    try {
      const result = await createProduct.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        stock: formData.stock,
        sku: formData.sku,
        status: 'active',
      });

      if (result.success) {
        toast.success('Producto creado exitosamente');
      } else {
        toast.error(result.error?.message || 'Error al crear producto');
      }
    } catch (error) {
      toast.error('Error inesperado');
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

#### Actualizar Producto

```typescript
import { useUpdateVenndeloProduct } from '@/hooks/useVenndelo';

function ProductEditor({ productId }: { productId: string }) {
  const updateProduct = useUpdateVenndeloProduct();

  const handleUpdate = async (updates: any) => {
    await updateProduct.mutateAsync({
      productId,
      updates: {
        price: updates.price,
        stock: updates.stock,
        status: updates.status,
      },
    });
  };

  return <EditForm onSubmit={handleUpdate} />;
}
```

### 2. Pedidos

#### Crear Pedido

```typescript
import { useCreateOrder } from '@/hooks/useVenndelo';
import { useCart } from '@/context/CartContext';

function CheckoutButton() {
  const createOrder = useCreateOrder();
  const { items, clearCart } = useCart();

  const handleCheckout = async () => {
    const orderData = {
      customer: {
        name: 'Juan Pérez',
        email: 'juan@ejemplo.com',
        phone: '+573001234567',
      },
      items: items.map(item => ({
        productId: item.product.id.toString(),
        quantity: item.quantity,
        price: 50000, // Precio por unidad
        name: item.product.nombre,
      })),
      subtotal: 100000,
      tax: 19000,
      shipping: 10000,
      total: 129000,
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      shippingAddress: {
        street: 'Calle 123',
        city: 'Bogotá',
        state: 'Cundinamarca',
        zipCode: '110111',
        country: 'Colombia',
      },
    };

    const result = await createOrder.mutateAsync(orderData);

    if (result.success) {
      clearCart();
      toast.success('Pedido creado exitosamente');
      // Redirigir a página de confirmación
    }
  };

  return (
    <button onClick={handleCheckout} disabled={createOrder.isPending}>
      {createOrder.isPending ? 'Procesando...' : 'Finalizar Compra'}
    </button>
  );
}
```

#### Listar Pedidos

```typescript
import { useOrders } from '@/hooks/useVenndelo';

function OrdersList() {
  const { data, isLoading } = useOrders(1, 20, 'pending');

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Pedidos Pendientes</h2>
      {data?.data?.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

#### Actualizar Estado de Pedido

```typescript
import { useUpdateOrderStatus } from '@/hooks/useVenndelo';

function OrderActions({ orderId }: { orderId: string }) {
  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = async (newStatus: Order['status']) => {
    await updateStatus.mutateAsync({
      orderId,
      status: newStatus,
    });
  };

  return (
    <div>
      <button onClick={() => handleStatusChange('confirmed')}>
        Confirmar
      </button>
      <button onClick={() => handleStatusChange('processing')}>
        En Proceso
      </button>
      <button onClick={() => handleStatusChange('shipped')}>
        Enviado
      </button>
    </div>
  );
}
```

### 3. Inventario

#### Consultar Inventario

```typescript
import { useInventory } from '@/hooks/useVenndelo';

function StockDisplay({ productId }: { productId: string }) {
  const { data, isLoading } = useInventory(productId);

  if (isLoading) return <span>...</span>;

  const inventory = data?.data;

  return (
    <div>
      <p>Stock: {inventory?.stock}</p>
      <p>Disponible: {inventory?.available}</p>
      <p>Reservado: {inventory?.reserved}</p>
      {inventory?.stock < (inventory?.lowStockThreshold || 10) && (
        <span className="text-red-500">Stock bajo</span>
      )}
    </div>
  );
}
```

#### Actualizar Stock

```typescript
import { useUpdateInventory } from '@/hooks/useVenndelo';

function InventoryManager({ productId }: { productId: string }) {
  const updateInventory = useUpdateInventory();

  const handleStockUpdate = async (newStock: number) => {
    await updateInventory.mutateAsync({
      productId,
      stock: newStock,
    });
  };

  return (
    <input
      type="number"
      onChange={(e) => handleStockUpdate(parseInt(e.target.value))}
    />
  );
}
```

### 4. Pagos

#### Crear Pago

```typescript
import { useCreatePayment } from '@/hooks/useVenndelo';

function PaymentForm({ orderId }: { orderId: string }) {
  const createPayment = useCreatePayment();

  const handlePayment = async (method: Payment['method']) => {
    const result = await createPayment.mutateAsync({
      orderId,
      amount: 129000,
      currency: 'COP',
      method,
      status: 'pending',
    });

    if (result.success) {
      // Procesar resultado del pago
    }
  };

  return (
    <div>
      <button onClick={() => handlePayment('mercadopago')}>
        Pagar con Mercado Pago
      </button>
      <button onClick={() => handlePayment('bank_transfer')}>
        Transferencia Bancaria
      </button>
    </div>
  );
}
```

### 5. Carrito de Compras

#### Usar el Carrito

```typescript
import { useCart } from '@/context/CartContext';

function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items, getItemCount } = useCart();

  const handleAddToCart = () => {
    addItem(product, 1);
    toast.success(`${product.nombre} agregado al carrito`);
  };

  return (
    <div>
      <button onClick={handleAddToCart}>
        Agregar al Carrito
      </button>
      <span>({getItemCount()} items)</span>
    </div>
  );
}
```

#### Mostrar Carrito

```typescript
import { useCart } from '@/context/CartContext';

function CartSidebar() {
  const { items, removeItem, updateQuantity, clearCart } = useCart();

  return (
    <div>
      <h2>Carrito</h2>
      {items.map(item => (
        <div key={`${item.product.id}-${item.variantId}`}>
          <p>{item.product.nombre}</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => 
              updateQuantity(item.product.id, parseInt(e.target.value))
            }
          />
          <button onClick={() => removeItem(item.product.id)}>
            Eliminar
          </button>
        </div>
      ))}
      <button onClick={clearCart}>Vaciar Carrito</button>
    </div>
  );
}
```

**Nota sobre precios**: El tipo `Product` actual no incluye campos de precio ya que los productos actuales se venden a través de enlaces de Mercado Libre. Cuando se migre completamente a Venndelo, los productos tendrán precios y las funciones `getSubtotal()` y `getTotal()` se implementarán completamente.

## Mejores Prácticas

### 1. Manejo de Errores

```typescript
import { useVenndeloProducts } from '@/hooks/useVenndelo';
import { toast } from 'sonner';

function ProductList() {
  const { data, error, isError } = useVenndeloProducts();

  useEffect(() => {
    if (isError && error) {
      toast.error('Error al cargar productos', {
        description: error.message,
      });
    }
  }, [isError, error]);

  // ...
}
```

### 2. Optimistic Updates

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateOrderStatus } from '@/hooks/useVenndelo';

function OrderStatus({ orderId, currentStatus }: Props) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();

  const handleUpdate = async (newStatus: Order['status']) => {
    // Optimistic update
    queryClient.setQueryData(
      ['venndelo-order', orderId],
      (old: any) => ({ ...old, status: newStatus })
    );

    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
    } catch (error) {
      // Revert on error
      queryClient.invalidateQueries({ queryKey: ['venndelo-order', orderId] });
    }
  };

  return <StatusSelector onChange={handleUpdate} />;
}
```

### 3. Paginación

```typescript
function PaginatedProducts() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVenndeloProducts(page, 20);

  return (
    <div>
      <ProductGrid products={data?.data} />
      <Pagination
        current={page}
        total={data?.pagination?.totalPages}
        onChange={setPage}
      />
    </div>
  );
}
```

### 4. Sincronización con Estado Local

```typescript
import { useVenndeloProducts } from '@/hooks/useVenndelo';
import { mockProducts } from '@/lib/data';

function SmartProductList() {
  const { data, isLoading, isError } = useVenndeloProducts();

  // Usar datos de Venndelo si están disponibles, sino usar mock
  const products = data?.success ? data.data : mockProducts;

  return (
    <div>
      {isError && <AlertBanner>Usando datos locales</AlertBanner>}
      <ProductGrid products={products} />
    </div>
  );
}
```

## Optimización y Cache

### Configuración de React Query

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Prefetch de Datos

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { fetchVenndeloProduct } from '@/lib/venndelo';

function ProductCard({ productId }: Props) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch product details on hover
    queryClient.prefetchQuery({
      queryKey: ['venndelo-product', productId],
      queryFn: () => fetchVenndeloProduct(productId),
    });
  };

  return <div onMouseEnter={handleMouseEnter}>...</div>;
}
```

### Invalidación Selectiva

```typescript
// Invalidar solo productos relacionados
queryClient.invalidateQueries({ 
  queryKey: ['venndelo-products'],
  exact: false 
});

// Invalidar producto específico
queryClient.invalidateQueries({ 
  queryKey: ['venndelo-product', productId],
  exact: true 
});
```

## Webhooks (Avanzado)

### Endpoint de Webhooks

```typescript
// En un servidor Node.js/Express
import { handleWebhook, verifyWebhookSignature } from '@/lib/venndelo';

app.post('/api/webhooks/venndelo', async (req, res) => {
  const signature = req.headers['x-venndelo-signature'] as string;
  const secret = process.env.VENNDELO_WEBHOOK_SECRET;

  // Verificar firma
  if (!verifyWebhookSignature(JSON.stringify(req.body), signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Procesar evento
  await handleWebhook(req.body);

  res.json({ received: true });
});
```

## Migración de Datos

### Script de Migración

```typescript
import { convertToVenndeloProduct, createVenndeloProduct } from '@/lib/venndelo';
import { mockProducts } from '@/lib/data';

async function migrateToVenndelo() {
  console.log(`Migrando ${mockProducts.length} productos...`);

  for (const product of mockProducts) {
    const venndeloProduct = convertToVenndeloProduct(product);
    const result = await createVenndeloProduct(venndeloProduct);

    if (result.success) {
      console.log(`✓ ${product.nombre} migrado`);
    } else {
      console.error(`✗ Error: ${product.nombre}`, result.error);
    }

    // Esperar 100ms entre cada request para no saturar la API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('Migración completada');
}
```

## Solución de Problemas

### API no está configurada

```typescript
import { isVenndeloConfigured } from '@/lib/venndelo';

if (!isVenndeloConfigured()) {
  console.warn('Venndelo no está configurado. Usando datos mock.');
}
```

### Rate Limiting

```typescript
// React Query ya implementa retry con backoff exponencial
// Para casos específicos:
const { data, error } = useQuery({
  queryKey: ['venndelo-products'],
  queryFn: fetchVenndeloProducts,
  retry: (failureCount, error) => {
    if (error.response?.status === 429) {
      return failureCount < 5; // Reintentar hasta 5 veces
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  },
});
```

## Seguridad

### Protección de Credenciales

**IMPORTANTE**: Nunca expongas las credenciales de API en el código del cliente.

```typescript
// ❌ NO HACER - Expone credenciales en el bundle del cliente
const API_KEY = 'vnd_live_xxxxxxxx';

// ✅ HACER - Usar variables de entorno
const API_KEY = import.meta.env.VITE_VENNDELO_API_KEY;
```

Las variables `VITE_*` están disponibles en el cliente, por lo que:
- Solo úsalas para operaciones de lectura pública
- Para operaciones sensibles (crear pedidos, pagos), usa un backend proxy
- Considera implementar un servidor intermedio para operaciones críticas

### Implementación de Backend Proxy (Recomendado)

Para producción, implementa un backend que maneje:

```typescript
// Backend Node.js/Express
import { createOrder } from './venndelo-server'; // No expuesto al cliente

app.post('/api/orders', authenticate, async (req, res) => {
  // Validar datos del cliente
  const orderData = validateOrder(req.body);
  
  // Usar credenciales del servidor (no del cliente)
  const result = await createOrder(orderData);
  
  res.json(result);
});
```

### Webhooks - Verificación de Firma

La función `verifyWebhookSignature` actualmente rechaza todas las peticiones por seguridad. Antes de usar webhooks en producción:

1. Consulta la documentación de Venndelo sobre su algoritmo de firma
2. Implementa verificación HMAC-SHA256 adecuada
3. Usa comparación de tiempo constante para prevenir timing attacks

```typescript
// Ejemplo de implementación segura (requiere Node.js crypto)
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

### Validación de Datos

Siempre valida datos antes de enviarlos a la API:

```typescript
import { z } from 'zod';

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  }),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })).min(1),
  total: z.number().positive(),
});

// Validar antes de enviar
const validatedOrder = orderSchema.parse(orderData);
await createOrder(validatedOrder);
```

## Recursos Adicionales

- [Documentación oficial de Venndelo](https://api.venndelo.com/v1/admin-docs/)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última actualización**: Enero 2026
