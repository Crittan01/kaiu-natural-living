# KAIU Natural Living - Orquestador Híbrido AI & E-Commerce (V.2026)

## 📌 1. Visión General del Proyecto y Patrón Arquitectónico

**KAIU** es una plataforma de software de grado de producción dividida en dos grandes dominios que interactúan de forma asíncrona:

1.  **Dashboard Frontend (SPA):** Una aplicación React/Vite orientada al administrador (Inventario, UI de Chats en tiempo real, Estadísticas) y al consumidor público (Tienda, Checkout Wompi).
2.  **Motor Backend IA (Event-Driven):** Un servidor Node.js/Express.js diseñado específicamente para interceptar webhooks de alta velocidad (WhatsApp), gestionar el estado de sesión de los clientes y delegar órdenes cognitivas a un LLM (Claude) empoderado con Recuperación Vectorial de Memoria (RAG).

Este repositorio implementa el patrón **Backend for Frontend (BFF)** con una pipeline de datos orientada a eventos para el procesamiento de Inteligencia Artificial mediante Workers de rescate.

---

## 🏗️ 2. Stack Tecnológico (Core)

### Capa de Presentación (Frontend)

- **Construcción:** React 18, TypeScript, Vite v5.4.11.
- **UI/UX:** Tailwind CSS v3.4, `shadcn/ui` (Radix Primitives), Framer Motion.
- **Gestión de Estado & Red:** Axios (HTTP), `socket.io-client` v4.8 (Suscripción WebSockets para mensajería síncrona).
- **Despliegue Asignado:** Vercel (Sitio estático CDN).

### Capa de Orquestación e IA (Backend de Rendimiento)

- **Entorno:** Node.js v20+, Express.js v4.19.
- **Orquestación de IA:** [LangChain JS](https://js.langchain.com/). Define topologías de grafos de lenguaje, llamadas a herramientas en JSON estricto (`.bindTools`) y manejo de historia de mensajes AI.
- **Motor LLM:** `claude-3-5-sonnet-20241022` (vía `@langchain/anthropic`).
- **Job Queues (Workers):** [BullMQ](https://docs.bullmq.io/) v5.69 + Redis. Patrón indispensable para absorber el alto caudal (throughput) de Webhooks entrantes de Meta sin bloquear el Single Event Loop de Node (Node bloquea durante las resoluciones I/O lentas de APIs de IA externas).
- **Comunicación Síncrona Web:** Servidor `Socket.io` v4 enganchado a Express.
- **Despliegue Asignado:** Render.com (Web Service / Docker).

### Capa de Persistencia y Modelos (Base de Datos)

- **Base de Datos Relacional:** PostgreSQL 15+.
- **Motor de Similitud Vectorial:** Extensión Nativa `pgvector`. Permite castear arreglos numéricos flotantes como `vector(1536)` para posibilitar búsquedas matemáticas de _Similitud del Coseno_ en la Base de Conocimientos de KAIU.
- **Motor Transaccional (ORM):** Prisma ORM v6.19. Archivo clave: `prisma/schema.prisma`.
- **Almacenamiento Binario (Buckets):** Supabase Storage enlazado mediante Service Role para subidas de imagen desde la memoria (multer) sin pasar por disco duro.

---

## 🔄 3. Ciclo de Vida de Eventos Críticos (Data Pipelines)

El verdadero reto arquitectónico de este repositorio es manejar el asincronismo. A un AI que vaya a modificar este código en el futuro: **¡Atención a este Pipeline!**

### 🔥 Pipeline 1: Webhook WhatsApp a Respuesta de IA (Flujo Asíncrono)

1.  **Entrada Webhook:** El cliente manda un SMS vía WhatsApp. Los servidores Cloud de Meta ejecutan un webhook a `POST /api/whatsapp/webhook`.
2.  **Validación Middleware:** Se computa un HMAC SHA-256 local sobre el _req.body_ original usando la variable `WHATSAPP_APP_SECRET`. Si es válida, continúa.
3.  **Inyección a Redis (Job Queue):** Node inserta de manera no-bloqueante el cuerpo del mensaje en la cola BullMQ (`whatsappQueue.add()`).
4.  **Escape de Red:** Fast-Return de Node. Tira un código `200 OK` al API de Meta Cloud en < 200 milisegundos. _Si no se hace esto, Meta aborta, cataloga el servidor de KAIU como defectuoso, y retenta el mensaje 5 veces saturando todo_.
5.  **Procesamiento Subproceso (El Worker BullMQ asume el control):**
    - **Lectura Dual Base:** Lee en Prisma la tabla `whatsapp_sessions`. Evalúa el booleano `isBotActive` del remitente. Si está `false` (hubo un Escalamiento/Handover en curso manual), la IA se inhibe y finaliza el Job.
    - **Si es True:** Instancia el Agente de LangChain. Langchain carga el System Prompt predefinido y manda el contexto a la LLM.
6.  **The Agent Loop (Tool Calling):**
    - El LLM de Anthropic puede requerir consultar inventario. En vez de responder en texto, emite una orden JSON especial: `{"name":"searchInventory", "args": {"query": "Lavanda"}}`.
    - Node intercepta esta orden, acude a Prisma, extrae inventario, y devuelve el resultado crudo al árbol del LLM de Anthropic.
    - Anthropic sintetiza la información empírica y la traduce a lenguaje natural empático de vendedor.
7.  **Despacho y WebSockets:**
    - Worker Node envía un POST a la Graph API v21.0 de Meta emulando un envío al WAMID del cliente usando `WHATSAPP_ACCESS_TOKEN`.
    - Inmediatamente invoca a local `app.get('io').emit("newMessage", data)`, que empuja el texto final a las pantallas React en el Dashboard (`/dashboard/chats`).

### 📦 Pipeline 2: Gestión Vectorial de Políticas RAG

1.  **Aprovisionamiento (Seed):** Scripts de backend leen Markdown o TXT. LangChain divide en Chunks el texto, luego llama al Embedding API para convertir "Nuestras envíos a Bogotá duran 1 día" a un Array de 1536 flotantes [0.124, 0.44...].
2.  **Consulta (Vector Search):** Cuando un cliente pregunta por envíos, la IA de Claude llama a la herramienta `searchKnowledgeBase`. La herramienta embebe la pregunta en vector, y Prisma emite SQL crudo estilo `ORDER BY embedding <=> '[...]' LIMIT 3`. El texto semánticamente más afín se retorna a Claude.

---

## � 4. Modelos de Base de Datos y Variables de Entorno Seguras

### Mapa Mental Prisma Schema (`prisma/schema.prisma`):

- `Product`: Tabula PK `sku`, `name`, `variantName`, `price`, `stock`, `isActive`. Relaciones de Variante agrupadas estéticamente en frontend. Dispone de Soft-Delete / Hard-Delete.
- `WhatsAppSession`: Motor de estado para WebHooks de Meta. Define si la conversación requiere IA o intervención humana al alterar la flag `isBotActive`.
- `KnowledgeBase`: La tabla RAG, incluye matriz `vector(1536)` inyectado SQL crudo con PostGis.
- `Order` / `OrderItem`: Tablas enlazadas dependientes de retrollamadas privadas webhook de la pasarela Wompi.

### Inyección de Entorno (Separación Vercel vs Render)

Para que un futuro desarrollador no comprometa las llaves, la segmentación es tajante:

**Capa PÚBLICA (Vercel):** Se definen bajo `.env.production`

- `VITE_API_URL`: Dirección de la app Node (Render).
- `VITE_WOMPI_PUB_KEY`: Pública. Renderiza los widgets iframe de pagos de Vercel.

**Capa PRIVADA (Render/VPS):** Variables críticas del Backend

- `DATABASE_URL="postgresql://...?pgbouncer=true"` (Conexión Transaccional Prisma)
- `REDIS_URL="rediss://..."` (Obligatorio para el Worker queue de BullMQ)
- `ANTHROPIC_API_KEY="sk-ant..."` (Cerebro Inteligencia Artificial)
- `WHATSAPP_APP_SECRET="/WHATSAPP_VERIFY_TOKEN/WHATSAPP_ACCESS_TOKEN/WHATSAPP_PHONE_ID"` (Triangulación API Meta)
- `SUPABASE_SERVICE_ROLE_KEY` (Role admin bypass policy para subir buffers img en RAM).
- `WOMPI_EVENTS_SECRET` / `WOMPI_INTEGRITY_SECRET` (Acredita vía Hashing asimétrico los webhooks de pago pagados).
- `KAIU_ADMIN_USERS='[{"username":"admin","pin":"1234"}]'` (El JSON Array parseado internamente por el Controller de Auth que inyecta tokens JWT para el dashboard).

_(Documentación Técnica Oficial. Actualizada y Revisada Exhaustivamente en Ciclo V.2026)._
