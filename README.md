# AgroNorte Corp - Sistema de Gestión

Este es el proyecto del sistema de gestión para AgroNorte Corp, desarrollado con Next.js en Firebase Studio. El sistema está configurado para funcionar con Supabase como backend.

## 🚀 Puesta en Marcha (Supabase)

Para que la aplicación funcione, necesitas configurar tu propia base de datos y almacenamiento en [Supabase](https://supabase.com/). Sigue estos pasos:

### Paso 1: Configurar el Proyecto de Supabase

1.  Crea un nuevo proyecto en Supabase.
2.  **Crear Buckets de Almacenamiento:**
    *   Ve a la sección **Storage** en tu proyecto de Supabase.
    *   Crea los siguientes 5 buckets. **Es muy importante que los marques como públicos** al crearlos:
        *   `products` (para imágenes de productos)
        *   `gallery` (para imágenes de la galería de logros)
        *   `avatars` (para fotos de perfil de usuario)
        *   `signatures` (para firmas de usuario)
        *   `company` (para el logo y fondo de inicio de sesión)
3.  **Configurar Políticas de Almacenamiento y Esquema de BD:**
    *   Ve al **SQL Editor** en tu proyecto de Supabase.
    *   Abre el archivo `schema.sql` que se encuentra en la raíz de este proyecto. Copia todo su contenido y pégalo en el editor.
    *   Haz clic en "RUN". Esto creará las políticas de almacenamiento, todas las tablas y cargará datos iniciales.

### Paso 2: Configurar las Variables de Entorno

1.  Crea un archivo llamado `.env.local` en la raíz de tu proyecto.
2.  Ve a **Settings -> API** en tu proyecto de Supabase para encontrar tus claves.
3.  Añade las siguientes líneas a tu archivo `.env.local`, reemplazando los valores con los de tu proyecto:

    ```bash
    NEXT_PUBLIC_SUPABASE_URL=URL_DE_TU_PROYECTO_SUPABASE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
    ```

### Paso 3: Iniciar el Servidor de Desarrollo

Ahora que todo está configurado, puedes iniciar tu aplicación.

1.  **Instalar Dependencias:**
    ```bash
    npm install
    ```
2.  **Iniciar el Servidor:**
    ```bash
    npm run dev
    ```

La aplicación estará disponible en `http://localhost:9003`.

**Credenciales de Administrador por Defecto:**
*   **Usuario:** `GabrielT`
*   **Contraseña:** `003242373`

## 📦 Subir a GitHub

Si deseas mantener tu proyecto en un repositorio de GitHub, sigue estos pasos:

1.  **Inicializar Git:**
    Abre una terminal en la raíz de tu proyecto y ejecuta:
    ```bash
    git init -b main
    ```

2.  **Añadir y Confirmar Cambios:**
    ```bash
    git add .
    git commit -m "Commit inicial del proyecto AgroNorte Corp"
    ```

3.  **Crear un Repositorio en GitHub:**
    *   Ve a [GitHub](https://github.com/new) y crea un nuevo repositorio. Puedes hacerlo público o privado.
    *   **No** lo inicialices con un archivo `README`, `.gitignore` o licencia, ya que tu proyecto ya los tiene.

4.  **Conectar tu Proyecto Local con GitHub:**
    Copia la URL de tu repositorio (por ejemplo, `https://github.com/tu-usuario/tu-repositorio.git`) y ejecútala en tu terminal:
    ```bash
    git remote add origin URL_DE_TU_REPOSITORIO
    ```

5.  **Subir tu Código:**
    Finalmente, sube tu código a GitHub:
    ```bash
    git push -u origin main
    ```