# KAIU Natural Living - Documentación Maestra Arquitectónica (V.2026)

Este documento es el **Whitepaper Técnico Definitivo** del proyecto KAIU. Está diseñado para ser asimilado por Ingenieros de Software Senior, Arquitectos Cloud, o Agentes de Inteligencia Artificial que requieran el 100% del contexto operativo, bases de datos y separaciones de capa lógica antes de intervenir el código.

---

## 🖥 1. Separación de Capas Frontend (BFF Pattern)

El proyecto Vercel (React/Vite) compila una sola SPA (Single Page Application), pero lógicamente está bifurcado por el enrutador (`react-router-dom`) en dos ecosistemas que no cruzan datos:

### 🟢 A. Capa Cliente (Pública - Tienda e-Commerce)

- **Enrutamiento:** Rutas en la raíz (ej: `/`, `/catalogo`, `/checkout`).
- **Funcionalidades:**
  - Vitrina dinámica que hidrata su estado leyendo de `GET /api/products` (Data Pública).
  - Motor de Carrito basado en memoria local (`CartContext`).
  - **Pasarela de Pago Wompi integrada mediante IFrame/Widget** protegido por `VITE_WOMPI_PUB_KEY` para pre-autorizar tarjetas de crédito o Nequi.
- **Seguridad:** No requiere autenticación. Genera peticiones anónimas al motor de productos.

### 🔴 B. Capa Admin (Privada - Orquestador KAIU)

- **Enrutamiento:** Protegido bajo el layout `/dashboard/*`.
- **Seguridad:** Requiere Login (JWT). El backend verifica un PIN contra la variable estática JSON `KAIU_ADMIN_USERS`. El token Bearer es obligatorio en todas estas rutas.
- **Topología de Módulos (Los 5 Pilares del Dashboard):**
  1. **Resumen Ejecutivo (`/dashboard/`):** Componente `OverviewPanel.tsx`. Muestra KPIs financieros (Ticket promedio, Total de órdenes) y gráficas en React Recharts extrayendo estadísticas del backend.
  2. **Órdenes y Envíos (`/dashboard/orders`):** Componente `OrdersPanel.tsx`. Central de logística. Monitorea cambios de estado post-Wompi (`PAID`, `SHIPPED`), imprime guías de transporte PDF haciendo proxy con la API oficial y audita la base de datos `Order`.
  3. **Inventario (`/dashboard/inventory`):** Componente `InventoryManager.tsx`. Maestro CRUD de `Products` y sus variantes. Controla precios, stock, dimensiones y "Soft Delete" seguro de variantes.
  4. **Conversaciones Inteligentes (`/dashboard/chats`):** Componentes `ChatList` y `ChatView`. Terminal de WebSockets (`Socket.io`). Observa en vivo qué responde la IA a cada celular, e incluye el botón **"Tomar Control (Handover)"** para mutear a Claude y hablar de humano a humano.
  5. **Cerebro RAG & Conocimiento (`/dashboard/knowledge`):** Componente `KnowledgePanel.tsx`. Entrena al LLM inyectando manuales en texto que son divididos en "Chunks" y casteados a vectores multidimensionales en `pgvector`.

---

## 🗄️ 2. Topología Estructural de Bases de Datos (Prisma Schema)

El cerebro de persistencia es PostgreSQL 15, estructurado a través de **Prisma ORM**. Todo el ecosistema debe mutar estas tablas con precisión quirúrgica.

### Tablas Nucleares de E-Commerce

- `Product`: Control de catálogo.
  - _Campos Críticos:_ `sku` (PK), `name` (Agrupador visual frontend), `variantName` (Gotero 10ml, etc), `price` (en Centavos COP).
  - _Logística:_ `weight`, `width`, `height` (Variables imperativas para cotizar envíos con transportadoras Nacionales).
- `Order` y `OrderItem`: Entidades transaccionales inmutables.
  - _Campos Críticos:_ `status` (PENDING, PAID, SHIPPED). Dependen umbilicalmente de que el **Webhook privado de Wompi** haga la validación de Integridad Criptográfica para pasar a `PAID`.
  - _Snapshot Logic:_ `shippingAddress` guarda un JSON duro. No se normaliza como relación, pues si el usuario muda de casa mañana, el histórico de esta factura no debe alterarse.

### Tablas Nucleares de Inteligencia Artificial (RAG & Webhooks)

- `WhatsAppSession`: El Director de Orquesta de Meta Cloud.
  - _Campo `isBotActive` (Boolean):_ Dictamina el Handover. Si es `True`, BullMQ autoriza a Claude procesar la respuesta. Si es `False`, Claude descarta el job y asume que un humano responderá desde el Dashboard.
  - _Campo `sessionContext`:_ Diccionario JSON temporal de memoria de LangChain (¿De qué estaban hablando hace 5 minutos?).
- `KnowledgeBase`: Colección Vectorial de Embeddings.
  - _Campo `embedding`:_ Casteado nativamente por extension `pgvector` (`Unsupported("vector(1536)")`). Almacena la traducción numérica de los manuales de envío y políticas de cambios. Prisma usa sentencias crudas SQL `ORDER BY embedding <=> '[...]'` para extraer los textos más acordes a la duda del usuario y dárselos a la IA antes de que ésta conteste.

---

## ⚡ 3. El Pipeline Asíncrono Híbrido (Data Workflow)

Para proteger a la Base de Datos y al Server de Node de morir por picos de tráfico en pautas de Facebook Ads (Millones de Webhooks simultáneos), el flujo de entrada es asíncrono.

1.  **Recepción:** Meta emite el mensaje JSON a `POST /api/whatsapp/webhook`.
2.  **Validación de Firma:** Node calcula el Hash `x-hub-signature-256` usando la llave maestra privada de Meta (`WHATSAPP_APP_SECRET`). Cortafuegos anti-inyección.
3.  **Buffer en Memoria (Redis):** Si pasa, se inyecta en milisegundos a la cola BullMQ e inmediatamente Node responde `200 OK` a Meta (Requisito estricto de Meta para evitar Timeouts).
4.  **Ejecución Pesada (Worker Thread):** Un Worker secundario de BullMQ saca el ticket. Descarga historial de Prisma, arma el grafo contextual (LangChain), e invoca la API `claude-3-5-sonnet`.
5.  **Invocación de Herramientas (Tool Calling):** Claude puede retornar JSON en lugar de texto (Ej: `{"action": "searchInventory", "sku": "LAV-1"}`). El Worker atrapa esto, escanea la tabla `Product` y retorna los precios exactos al cerebro LLM.
6.  **Despacho Dual:** Una vez Claude decide el texto final:
    - Se hace POST a Meta Graph API v21 para enviar el SMS al celular físico del usuario (Usa `WHATSAPP_ACCESS_TOKEN`).
    - Se dispara el Web Socket `io.emit()` para que las pantallas de Vercel/React del administrador reciban la burbuja verde tipo WhatsApp Web al instante.

---

## 🔐 4. Matriz Criptográfica y Variables de Entorno

### Entorno Vercel (Front) `.env.production`

Ningún secreto profundo va aquí. El código de React es visible desde F12 (Inspect).

- `VITE_API_URL`: Enlaza Vercel con la IP del Servidor API (Render).
- `VITE_WOMPI_PUB_KEY`: Pública mercantil.

### Entorno Render (Servidor) `.env`

Bóveda fuerte. No accesibles desde afuera.

- `DATABASE_URL` (Conector Prisma PostgreSQL transaccional)
- `REDIS_URL` (Motor Broker de Mensajes para BullMQ)
- `ANTHROPIC_API_KEY` (Facturación de API LLM Claude)
- `WHATSAPP_PHONE_ID` / `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_VERIFY_TOKEN` (Cerebro Conector WA)
- `WHATSAPP_APP_SECRET` (Llave de firma HMAC SHA-256 de webhooks)
- `WOMPI_EVENTS_SECRET` / `WOMPI_INTEGRITY_SECRET` (Validación SHA-256 para prevenir que cibercriminales simulen que ya pagaron un pedido).
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (Acceso root de almacenamiento para Subir Imagenes eludiendo límites RLS de Postgres).

### Instrucciones de Re-Despliegue Local Rápido

- Arrancar DB: `npx prisma db push`
- Arrancar API Node: `npm run api` (Puerto 3001)
- Arrancar Vite: `npm run dev` (Puerto 3000)
- Simulador Webhook (Para codear sin Meta Cloud): `node scripts/simulate_webhook_test.js`
