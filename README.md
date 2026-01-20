# KAIU Natural Living

Proyecto de cosmética natural y bienestar.

## Información del Proyecto

**URL**: [Insertar URL del despliegue aquí]

## Desarrollo Local

Para trabajar localmente en este proyecto, sigue estos pasos:

### Requisitos

- Node.js & npm instalados. Se recomienda usar [nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

### Instalación

```sh
# Paso 1: Clonar el repositorio
git clone <URL_DEL_REPO>

# Paso 2: Navegar al directorio
cd kaiu-natural-living

# Paso 3: Instalar dependencias
npm install

# Paso 4: Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Venndelo
```

### Ejecutar Servidor de Desarrollo

```sh
npm run dev
```

Esto iniciará el servidor en `http://localhost:8080`.

## Integración con Venndelo API

Este proyecto está integrado con la API de Venndelo para gestión de productos, inventario y pedidos.

### Configuración de Venndelo

1. **Obtener credenciales**: Accede a tu panel de administración de Venndelo y obtén:
   - API Key
   - Store ID

2. **Configurar variables de entorno**: Edita el archivo `.env`:

```env
VITE_VENNDELO_URL=https://api.venndelo.com/v1
VITE_VENNDELO_API_KEY=tu_api_key_aqui
VITE_VENNDELO_STORE_ID=tu_store_id_aqui
VITE_USE_VENNDELO=true
```

3. **Verificar configuración**:

```typescript
import { getVenndeloConfig } from '@/lib/venndelo';

console.log(getVenndeloConfig());
// { baseUrl: "...", hasApiKey: true, hasStoreId: true, isConfigured: true }
```

### Funcionalidades Disponibles

#### 1. Gestión de Productos

```typescript
import { useVenndeloProducts } from '@/hooks/useVenndelo';

function ProductList() {
  const { data, isLoading, error } = useVenndeloProducts();
  
  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.data?.map(product => (
        <div key={product.id}>{product.nombre}</div>
      ))}
    </div>
  );
}
```

#### 2. Gestión de Pedidos

```typescript
import { useCreateOrder } from '@/hooks/useVenndelo';

function Checkout() {
  const createOrder = useCreateOrder();
  
  const handleCheckout = async () => {
    const result = await createOrder.mutateAsync({
      customer: {
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        phone: "+573001234567"
      },
      items: [
        {
          productId: "1",
          quantity: 2,
          price: 50000,
          name: "Aceite de Lavanda"
        }
      ],
      total: 100000,
      status: "pending",
      paymentStatus: "pending"
    });
    
    if (result.success) {
      console.log("Pedido creado:", result.data);
    }
  };
  
  return <button onClick={handleCheckout}>Realizar Pedido</button>;
}
```

#### 3. Inventario

```typescript
import { useInventory, useUpdateInventory } from '@/hooks/useVenndelo';

function InventoryManager({ productId }) {
  const { data } = useInventory(productId);
  const updateInventory = useUpdateInventory();
  
  const handleUpdateStock = (newStock: number) => {
    updateInventory.mutate({ productId, stock: newStock });
  };
  
  return (
    <div>
      <p>Stock actual: {data?.data?.stock}</p>
      <p>Disponible: {data?.data?.available}</p>
    </div>
  );
}
```

#### 4. Carrito de Compras

```typescript
import { useCart } from '@/context/CartContext';

function CartButton({ product }) {
  const { addItem, items, getItemCount } = useCart();
  
  return (
    <div>
      <button onClick={() => addItem(product, 1)}>
        Agregar al carrito
      </button>
      <span>Items: {getItemCount()}</span>
    </div>
  );
}
```

### API de Venndelo - Endpoints Principales

La integración incluye los siguientes módulos:

1. **Productos** (`/products`)
   - `GET /products` - Listar productos
   - `GET /products/:id` - Obtener producto
   - `POST /products` - Crear producto
   - `PUT /products/:id` - Actualizar producto

2. **Pedidos** (`/orders`)
   - `GET /orders` - Listar pedidos
   - `GET /orders/:id` - Obtener pedido
   - `POST /orders` - Crear pedido
   - `PATCH /orders/:id` - Actualizar estado

3. **Inventario** (`/inventory`)
   - `GET /inventory/:productId` - Consultar inventario
   - `PATCH /inventory/:productId` - Actualizar stock
   - `GET /inventory/low-stock` - Productos con bajo stock

4. **Pagos** (`/payments`)
   - `POST /payments` - Crear pago
   - `GET /payments/:id` - Consultar pago
   - `PATCH /payments/:id` - Actualizar estado

5. **Analíticas** (`/analytics`)
   - `GET /analytics/sales` - Reportes de ventas
   - `GET /analytics/products/:id` - Rendimiento de productos

### Estrategia de Fallback

El sistema implementa una estrategia de fallback en cascada:

1. **Venndelo API** (si `VITE_USE_VENNDELO=true`)
2. **SheetDB** (si `VITE_SHEETDB_URL` está configurado)
3. **Datos Mock** (siempre disponible para desarrollo)

Esto garantiza que la aplicación funcione incluso sin configuración de API.

### Cache y PWA

La aplicación incluye cache de API mediante Service Workers:

- **Venndelo API**: NetworkFirst, 5 minutos de cache
- **Productos**: Se actualizan cada 5 minutos
- **Pedidos**: Se actualizan cada 2 minutos
- **Inventario**: Se actualiza cada 1 minuto

### Webhooks (Opcional)

Para recibir notificaciones en tiempo real de Venndelo:

```typescript
import { handleWebhook, verifyWebhookSignature } from '@/lib/venndelo';

// En tu endpoint de webhooks
app.post('/webhooks/venndelo', (req, res) => {
  const signature = req.headers['x-venndelo-signature'];
  const payload = JSON.stringify(req.body);
  
  if (verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    handleWebhook(req.body);
    res.json({ received: true });
  } else {
    res.status(401).json({ error: 'Invalid signature' });
  }
});
```

### Migración de Datos

Para migrar productos existentes a Venndelo:

```typescript
import { convertToVenndeloProduct, createVenndeloProduct } from '@/lib/venndelo';
import { mockProducts } from '@/lib/data';

async function migrateProducts() {
  for (const product of mockProducts) {
    const venndeloProduct = convertToVenndeloProduct(product);
    await createVenndeloProduct(venndeloProduct);
  }
}
```

## Tecnologías Utilizadas

Este proyecto está construido con:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Query
- React Router DOM
- Venndelo API Integration

## Testing

```sh
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch
```

## Build

```sh
# Build para producción
npm run build

# Build para desarrollo
npm run build:dev

# Preview del build
npm preview
```

## Soporte

Para más información sobre la API de Venndelo, consulta la documentación oficial:
- **Documentación**: https://api.venndelo.com/v1/admin-docs/
- **Panel Admin**: https://admin.venndelo.com/
