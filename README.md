# Bitworks Message System

Este proyecto implementa un sistema de chat con IA para la gestión de conversaciones con clientes, permitiendo la integración con plataformas como n8n para la orquestación de la lógica de negocio.

## Arquitectura

El sistema se compone de tres servicios principales:

1.  **Core Service (Python/FastAPI):**
    *   Gestiona la base de datos (clientes, usuarios, plantillas, atributos, conversaciones, mensajes).
    *   Provee APIs internas para la administración y carga de datos.
    *   Puerto por defecto: `8000`

2.  **Agent Service (Python/FastAPI):**
    *   Actúa como la interfaz pública para la interacción con el chat.
    *   Maneja el envío de mensajes de usuario a la IA (vía webhook) y la recepción de respuestas de la IA.
    *   Gestiona las conexiones WebSocket para la comunicación en tiempo real con el frontend.
    *   Puerto por defecto: `8001`

3.  **Frontend (React/MUI):**
    *   Interfaz de usuario para la administración del sistema (clientes, usuarios, plantillas, parámetros).
    *   Interfaz de chat para la interacción del usuario final.
    *   Puerto por defecto: `3000`

## Configuración del Entorno

### Prerrequisitos

Asegúrate de tener instalado lo siguiente:

*   **Python 3.9+**
*   **pip** (gestor de paquetes de Python)
*   **Node.js** (versión LTS recomendada)
*   **Yarn** (gestor de paquetes de Node.js)
*   **PostgreSQL** (servidor de base de datos)

### Pasos de Configuración

1.  **Clonar el Repositorio:**
    