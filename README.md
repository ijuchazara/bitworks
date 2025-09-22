# Bitworks Message System

Este proyecto implementa un sistema de chat con IA para la gestión de conversaciones con clientes, permitiendo la integración con plataformas como n8n para la orquestación de la lógica de negocio.

## Arquitectura

El sistema sigue una arquitectura de microservicios y se compone de tres componentes principales que se ejecutan de forma independiente:

1.  **Core Service (Python/FastAPI):**
    *   Gestiona la base de datos (clientes, usuarios, plantillas, conversaciones, etc.).
    *   Provee APIs internas para la administración y carga de datos.
    *   Puerto por defecto: `8000`

2.  **Agent Service (Python/FastAPI):**
    *   Actúa como la interfaz pública para la interacción del chat.
    *   Maneja el envío de mensajes de usuario a la IA (vía webhook) y la recepción de respuestas.
    *   Gestiona las conexiones WebSocket para la comunicación en tiempo real con el frontend.
    *   Puerto por defecto: `8001`

3.  **Frontend (Next.js/React):**
    *   Interfaz de usuario para la administración del sistema.
    *   Interfaz de chat para la interacción del usuario final.
    *   Puerto por defecto: `3000`

## Configuración del Entorno de Desarrollo

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### 1. Prerrequisitos

Asegúrate de tener instalado lo siguiente:

*   **Python 3.9+**
*   **Node.js** (versión LTS recomendada)
*   **Yarn** (o `npm`)
*   **PostgreSQL** (servidor de base de datos)

### 2. Clonar el Repositorio

```sh
git clone <URL_DEL_REPOSITORIO>
cd bitworks
```

### 3. Configurar el Backend (Python)

1.  **Crear un Entorno Virtual:**
    ```sh
    python -m venv venv
    ```

2.  **Activar el Entorno Virtual:**
    *   En Windows:
        ```sh
        .\venv\Scripts\activate
        ```
    *   En macOS/Linux:
        ```sh
        source venv/bin/activate
        ```

3.  **Instalar Dependencias de Python:**
    ```sh
    pip install -r requirements.txt
    ```

### 4. Configurar el Frontend (Node.js)

1.  **Navegar al Directorio del Frontend:**
    ```sh
    cd frontend
    ```

2.  **Instalar Dependencias de Node.js:**
    ```sh
    yarn install
    ```

3.  **Regresar al Directorio Raíz:**
    ```sh
    cd ..
    ```

### 5. Configurar la Base de Datos y Variables de Entorno

1.  **Crear la Base de Datos:** Asegúrate de que tu servidor de PostgreSQL esté en ejecución y crea una nueva base de datos para este proyecto.

2.  **Crear el Archivo `.env`:**
    *   En la raíz del proyecto, crea un archivo llamado `.env`.
    *   Añade la URL de conexión a tu base de datos. Reemplaza `user`, `password`, `host`, `port` y `dbname` con tus credenciales.

    ```env
    # Ejemplo de contenido para .env
    DATABASE_URL=postgresql://user:password@host:port/dbname
    ```

3.  **Ejecutar las Migraciones de la Base de Datos:**
    *   Alembic gestiona el esquema de la base de datos. Para aplicar todas las migraciones y crear las tablas, ejecuta:
    ```sh
    alembic upgrade head
    ```

## Ejecutar la Aplicación

El proyecto incluye un script para iniciar todos los servicios simultáneamente.

Desde la raíz del proyecto, y con tu entorno virtual de Python activado, ejecuta:

```sh
python start_dev.py
```

Esto iniciará los tres servicios. Podrás acceder a la aplicación frontend en **http://localhost:3000**.

Para detener todos los servicios, simplemente presiona `Ctrl+C` en la terminal donde se está ejecutando el script.

## Gestión de la Base de Datos con Alembic

Cuando realices cambios en los modelos de SQLAlchemy (en `shared/models.py`), debes crear una nueva migración para aplicar esos cambios a la base de datos.

1.  **Generar una Nueva Migración:**
    *   Después de modificar un modelo, ejecuta el siguiente comando. Alembic detectará los cambios automáticamente.
    ```sh
    alembic revision --autogenerate -m "Un mensaje descriptivo del cambio"
    ```

2.  **Aplicar la Migración:**
    *   Para aplicar la nueva migración (y cualquier otra pendiente) a la base de datos, ejecuta:
    ```sh
    alembic upgrade head
    ```
