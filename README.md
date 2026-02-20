# KAIU Natural Living - e-Commerce & AI Orchestrator (V.2026)

Este proyecto es una plataforma de comercio electrónico moderna potenciada por un **Orquestador de IA** para WhatsApp.

## 🏗️ Arquitectura (V.2026)

El sistema ha migrado de una arquitectura basada en hojas de cálculo a una stack robusta y escalable:

- **Frontend**: React + Vite + TailwindCSS (Dashboard & Tienda).
- **Backend**: Node.js + Express.
- **Base de Datos**: PostgreSQL (Supabase) con extensión `pgvector` para RAG.
- **ORM**: Prisma IO.
- **Colas / Segundo Plano**: BullMQ + Redis.
- **IA**: Anthropic Claude 3.5 Sonnet + LangChain.
- **Mensajería**: WhatsApp Cloud API.

---

## 🚀 Requisitos Previos

- Node.js v20+
- PostgreSQL (con pgvector activado)
- Redis Server (Local o Remoto)

## 🛠️ Configuración Local

1.  **Instalar dependencias**:

    ```bash
    npm install
    ```

2.  **Configurar Entorno**:
    Copia `.env.example` a `.env.local` y `prisma/.env` y completa las variables:
    - `DATABASE_URL`: Tu conexión a Postgres.
    - `REDIS_HOST`: localhost (o tu proveedor).
    - `WHATSAPP_*`: Credenciales de Meta.
    - `ANTHROPIC_API_KEY`: Tu llave de Anthropic.

3.  **Iniciar Base de Datos**:

    ```bash
    npx prisma db push
    npm run seed  # (Opcional) Carga datos iniciales
    ```

4.  **Ejecutar Todo (Script Mágico)**:
    ```bash
    ./START_ALL.sh
    ```
    Este script inicia Redis, Backend (Puerto 3001) y Frontend (Vite) simultáneamente.

---

## 🤖 AI Orchestrator & Dashboard

El sistema incluye un **Panel de Control** en `/dashboard` para agentes humanos.

- **Modo IA**: El bot responde automáticamente usando RAG (Búsqueda en base de conocimiento).
- **Handover**: Si el usuario pide "humano", el bot se apaga y notifica al dashboard.
- **Privacidad**: Filtros PII automáticos (Emails/Teléfonos ocultos en historial de IA).
- **Transparencia**: Todas las respuestas de IA llevan firma.

---

## 📦 Despliegue (Producción)

### Base de Datos & Redis

Recomendado: **Supabase** (DB) + **Upstash** (Redis) o **Railway** (Ambos).

### Backend & Frontend

Pueden desplegarse en **Vercel**, **Railway** o **VPS**.
Asegúrate de configurar las variables de entorno de producción.

---

## 📁 Estructura del Proyecto

- `src/`: Frontend React (Componentes, Páginas).
- `backend/`: Servidor Express y Lógica de Negocio.
- `backend/whatsapp/`: Webhooks y Workers de BullMQ.
- `backend/services/ai/`: Lógica RAG y LangChain.
- `prisma/`: Esquema de Base de Datos y Seeders.
