# KAIU Natural Living - e-Commerce & AI Orchestrator (V.2026)

Este proyecto es una plataforma de comercio electrónico de grado de producción, dividida en un potente Dashboard Frontend y un Servidor Backend impulsado por Inteligencia Artificial y un motor RAG (_Retrieval-Augmented Generation_). Su propósito principal es gestionar el catálogo de productos y **orquestar la atención al cliente automática vía WhatsApp usando IA.**

---

## 🏗️ Arquitectura del Sistema (Mapeo Técnico)

El sistema opera bajo un modelo _Backend for Frontend (BFF)_ y Arquitectura Orientada a Eventos (EDA). Está diseñado para ser escalable, asíncrono y tolerante a fallos.

### 1. Frontend (Dashboard & Tienda Web)

- **Core:** React 18, TypeScript, [Vite JS](https://vitejs.dev/) (v5.4.11).
- **Estilos:** TailwindCSS + `shadcn/ui` + Radix UI Primitives.
- **Estado & Tiempo Real:** React Hooks + [Socket.io Client](https://socket.io/) para observar la comunicación del Chat de WhatsApp en vivo.
- **PWA:** Soporte para Progressive Web App mediante `vite-plugin-pwa`.
- **Responsabilidades:** Sirve como la interfaz de usuario para administradores. Maneja la creación de ordenes Wompi (LLaves Públicas), gestión de inventario, visualización del Chat en tiempo real, y control de "Handover" (Interruptor de apagado/encendido del Bot AI).
- **Despliegue Objetivo:** Vercel (Sitio estático CDN).

### 2. Backend (Orquestador & API)

- **Core:** Node.js v20+, Express.js.
- **Orquestación de Memoria:** [LangChain](https://js.langchain.com/) para el manejo del flujo del LLM.
- **Inteligencia Artificial:** Anthropic Claude 3.5 Sonnet (`@langchain/anthropic`).
- **Gestión de Colas (Workers):** [BullMQ](https://docs.bullmq.io/) + Redis (Protege y ordena el tráfico entrante masivo de mensajes de Meta/WhatsApp para no saturar la BD ni bloquear el Event Loop de Node).
- **Tiempo Real:** Servidor `Socket.io` adherido a Express para emitir los mensajes procesados al Dashboard Frontend.
- **Responsabilidades:** Puerta de enlace segura con validación `X-Hub-Signature-256` para Webhooks de Meta, procesamiento AI RAG, validación de firmas privadas Wompi, persistencia directa de métricas y seguridad JWT para el admin.
- **Despliegue Objetivo:** Render.com (Web Service continuo).

### 3. Base de Datos & Almacenamiento

- **Base de Datos Principal:** PostgreSQL 15+.
- **Motor RAG / Búsqueda Semántica:** Extensión `pgvector` nativa en Postgres para almacenar y buscar vectores de 1536 dimensiones provenientes del conocimiento de la empresa.
- **ORM (Capa Transaccional):** [Prisma ORM](https://www.prisma.io/). Define los modelos transaccionales: Inventario, Sesiones de WhatsApp (Manejo de estados isBotActive y contexto de sesiones), Usuarios y Base de Conocimientos.
- **Almacenamiento de Medios (imágenes):** [Supabase Storage](https://supabase.com/). Enlaza buffers directamente desde el Dashboard o Servidor hacia la nube a través de permisos `Service Role`, retornando links absolutos.
- **Caché y Colas:** Instancia de Redis 5+ (BullMQ requiere Redis Server).

---

## 🔄 Flujo de Trabajo Exhaustivo (Data Pipeline)

**1. Flujo de Atención WhatsApp AI:**

1.  **Entrada:** El cliente escribe por WhatsApp. Los servidores de Meta disparan un Payload JSON firmado al Webhook `POST /api/whatsapp/webhook`.
2.  **Admisión Inmediata:** El MiddleWare encripta el body para verificar el X-Hub-Signature. Si es genuino, Express retorna **inmediatamente** un código HTTP `200 OK` a Meta (requerido para no ser bloqueados) y **empuja el payload a la cola de BullMQ en Redis**.
3.  **Procesamiento AI:** El Worker toma el trabajo de Redis en un subproceso.
    - Verifica en Prisma si `whatsapp_sessions.isBotActive` es verdadero. (Si es falso, se silencia y deja que el humano hable).
    - Extrae el texto y consulta la IA mediante RAG (_Retrieval-Augmented Generation_).
    - La IA tiene herramientas asignadas (`.bindTools`): Puede buscar productos (`searchInventory`) o buscar políticas de envío (`searchKnowledgeBase`) usando similitud de coseno vectorial en Prisma (`<=>`).
4.  **Respuesta:** Una vez Claude formula la respuesta usando las herramientas, Node llama al API oficial de Meta Graph v21.0 y envía el mensaje de vuelta.
5.  **Reflejo Web:** Paralelamente, Node emite un evento vía **Socket.io** (`"newMessage"`) que causa que la burbuja del chat aparezca al instante en el monitor de los administradores en `/dashboard/chats`.

**2. Flujo de Inventario (Frontend):**

1.  El Admin carga `/dashboard/inventory`.
2.  Vite consulta `VITE_API_URL/api/admin/inventory`.
3.  Prisma extrae los productos y sus `Variantes`, devolviendo un JSON que React mapea en vistas de grilla o tabla.
4.  Si el usuario borra una variante (Phase 16 UX), React ejecuta un `DELETE` seguro usando JWT y actualiza optimísticamente su caché visual.

---

## 🚀 Entorno & Variables de Ejecución

Debido a la división entre Vercel y Render, debe existir una estricta separación de secretos (Variables de Entorno).

### 🟢 Frontend Seguros (Vercel)

Única variable requerida en producción frontend:

- `VITE_API_URL`: URL del backend de Render.
- _Nota:_ Claves públicas tipo Wompi pueden vivir aquí sin riesgo. **No colocar secretos acá.**

### 🔴 Backend Críticos (Render)

Todas estas llaves son de vida de servidor y nunca se envían al cliente:

- `DATABASE_URL` (Conexión Prisma a DB pgvector)
- `REDIS_URL` (Redis Cloud para BullMQ)
- `ANTHROPIC_API_KEY` (Claude AI)
- `WHATSAPP_VERIFY_TOKEN` (Clave manual para webhook setup)
- `WHATSAPP_ACCESS_TOKEN` (Graph API Token)
- `WHATSAPP_PHONE_ID` (Meta Business Phone ID)
- `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Para subir audios, fotos directas)
- `WOMPI_PRV_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` (Manejo de dinero/webhook mercantil seguro)
- `KAIU_ADMIN_USERS`: Array JSON (ej. `[{"username":"admin","pin":"1234"}]`) usado para inyectar y autorizar cuentas.

---

## 🛠️ Contribución & Desarrollo Local

Para desarrollo local, se pueden usar túneles (Ngrok/LocalTunnel) para enlazar Meta Cloud con `localhost:3001` sin requerir despliegues por cada cambio de NLP empresarial.

1.  Instalar dependencias: `npm install`
2.  Preparar Base de Datos: `npx prisma db push`
3.  Arrancar ambos ecosistemas simultáneamente en local:
    ```bash
    ./START_ALL.sh
    ```
    _(Éste script levanta un `redis-server` si está presente localmente, seguido del API backend y Vite Dev Server)._

---

_Arquitectado para alto volumen, respuestas de un dígito por milisegundo en webhook y persistencia vectorial, asegurando que KAIU opere automáticamente 24/7 de manera profesional bajo V.2026 specs._
