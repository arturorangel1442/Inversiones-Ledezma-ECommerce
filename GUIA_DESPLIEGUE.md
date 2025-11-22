# Guía de Despliegue - Supermercado E-commerce

Esta guía te ayudará a desplegar tu aplicación en producción usando Vercel o Netlify para el Frontend y Render para el Backend.

## 📋 Requisitos Previos

- Git instalado en tu PC
- Cuenta en GitHub
- Cuenta en Vercel o Netlify (para Frontend)
- Cuenta en Render (para Backend)

---

## 🚀 Paso 1: Preparar el Repositorio Git

### 1.1 Instalar Git (si no lo tienes)

- **Windows**: Descarga desde [git-scm.com](https://git-scm.com/download/win)
- **Mac**: Ejecuta `brew install git` o descarga desde [git-scm.com](https://git-scm.com/download/mac)
- **Linux**: Ejecuta `sudo apt-get install git` (Ubuntu/Debian)

### 1.2 Inicializar el Repositorio

Abre la Terminal (o PowerShell en Windows) en la carpeta principal de tu proyecto:

```bash
cd C:\Users\Usuario\Desktop\supermercado-ecommerce
git init
```

### 1.3 Configurar Git (si es la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### 1.4 Añadir todos los archivos al repositorio

```bash
git add .
git commit -m "Primera versión: aplicación completa lista para producción"
```

---

## 📤 Paso 2: Subir a GitHub

### 2.1 Crear un Repositorio en GitHub

1. Ve a [github.com](https://github.com) e inicia sesión
2. Haz clic en el botón **"+"** en la esquina superior derecha
3. Selecciona **"New repository"**
4. Completa:
   - **Repository name**: `supermercado-ecommerce` (o el nombre que prefieras)
   - **Description**: "E-commerce de supermercado con React y Flask"
   - **Visibility**: Elige **Public** o **Private**
   - **NO marques** "Initialize with README" (ya tenemos archivos)
5. Haz clic en **"Create repository"**

### 2.2 Conectar tu Repositorio Local con GitHub

GitHub te mostrará comandos. Ejecuta estos (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
git remote add origin https://github.com/TU_USUARIO/supermercado-ecommerce.git
git branch -M main
git push -u origin main
```

Si te pide autenticación, usa un **Personal Access Token** en lugar de tu contraseña:
- Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Genera un nuevo token con permisos `repo`
- Úsalo como contraseña cuando Git te lo pida

---

## 🌐 Paso 3: Desplegar el Backend en Render

### 3.1 Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Crea una cuenta (puedes usar GitHub para iniciar sesión)
3. Conecta tu cuenta de GitHub

### 3.2 Crear un Nuevo Web Service

1. En el Dashboard, haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub
3. Selecciona el repositorio `supermercado-ecommerce`
4. Configura:
   - **Name**: `supermercado-backend` (o el nombre que prefieras)
   - **Region**: Elige la más cercana a tus usuarios
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
5. En **Environment Variables**, añade:
   - `SECRET_KEY`: Genera una clave secreta segura (puedes usar: `python -c "import secrets; print(secrets.token_hex(32))"`)
   - `ALLOWED_ORIGINS`: `https://inversionesledezma.vercel.app,https://www.inversionesledezma.vercel.app` (ajusta con tu dominio real)
   - `DATABASE_URL`: **IMPORTANTE** - Necesitas crear una base de datos PostgreSQL primero (ver sección 3.3)
6. Haz clic en **"Create Web Service"**

### 3.3 Crear Base de Datos PostgreSQL en Render

**IMPORTANTE**: El backend requiere PostgreSQL en producción. Sigue estos pasos:

1. En el Dashboard de Render, haz clic en **"New +"** → **"PostgreSQL"**
2. Configura:
   - **Name**: `supermercado-db` (o el nombre que prefieras)
   - **Database**: `supermercado` (o el nombre que prefieras)
   - **User**: Se generará automáticamente
   - **Region**: Elige la misma región que tu Web Service
   - **PostgreSQL Version**: Usa la versión más reciente disponible
   - **Plan**: Elige el plan gratuito o el que prefieras
3. Haz clic en **"Create Database"**
4. Una vez creada, ve a la pestaña **"Connections"** de tu base de datos
5. Copia la **"Internal Database URL"** (formato: `postgresql://user:password@host:port/dbname`)
6. Ve a tu Web Service → **Environment** → **Environment Variables**
7. Añade o actualiza:
   - **Key**: `DATABASE_URL`
   - **Value**: Pega la URL que copiaste
8. Guarda los cambios

**Nota**: El backend detectará automáticamente `DATABASE_URL` y usará PostgreSQL. Si no está configurada, usará SQLite (solo para desarrollo local).

### 3.4 Obtener la URL del Backend

Una vez desplegado, Render te dará una URL como: `https://supermercado-backend.onrender.com`

**⚠️ IMPORTANTE**: Copia esta URL, la necesitarás para configurar el Frontend.

**Nota sobre la Base de Datos**: La primera vez que se ejecute el backend, las tablas se crearán automáticamente gracias a la función `init_db()`. Si necesitas migrar datos desde SQLite local a PostgreSQL, deberás hacerlo manualmente o usar herramientas de migración.

---

## 🎨 Paso 4: Desplegar el Frontend en Vercel

### 4.1 Crear Cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Inicia sesión con tu cuenta de GitHub

### 4.2 Importar Proyecto

1. En el Dashboard, haz clic en **"Add New..."** → **"Project"**
2. Importa tu repositorio de GitHub: `supermercado-ecommerce`
3. Configura:
   - **Framework Preset**: Vite (debería detectarse automáticamente)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (debería estar por defecto)
   - **Output Directory**: `dist` (debería estar por defecto)
   - **Install Command**: `npm install` (debería estar por defecto)

### 4.3 Configurar Variables de Entorno (Opcional)

Si necesitas variables de entorno, añádelas en la sección **"Environment Variables"**.

### 4.4 Desplegar

1. Haz clic en **"Deploy"**
2. Espera a que se complete el despliegue (2-3 minutos)
3. Vercel te dará una URL como: `https://supermercado-ecommerce.vercel.app`

### 4.5 Configurar la URL del Backend

**IMPORTANTE**: El proxy de Vite solo funciona en desarrollo. Para producción, necesitas configurar la URL del backend.

**Opción 1: Usar Variable de Entorno (Recomendado)**

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Añade una variable:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://tu-backend.onrender.com` (la URL de tu backend en Render, **sin** barra final)
   - **Environment**: Production, Preview, Development (marca todas)

3. El código ya está preparado para usar esta variable. Si necesitas actualizar manualmente algún componente, usa:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || ''
   fetch(`${API_URL}/api/productos`)
   ```

**Opción 2: Configurar Rewrites en Vercel (Alternativa)**

Si prefieres usar rutas relativas (`/api/...`), puedes configurar rewrites en `vercel.json` para redirigir las peticiones al backend. El archivo `vercel.json` ya está configurado, pero necesitarías añadir:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://tu-backend.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Recomendación**: Usa la Opción 1 (Variable de Entorno) ya que es más flexible y segura.

---

## 🌐 Paso 4 (Alternativa): Desplegar el Frontend en Netlify

### 4.1 Crear Cuenta en Netlify

1. Ve a [netlify.com](https://netlify.com)
2. Haz clic en **"Sign up"**
3. Inicia sesión con tu cuenta de GitHub

### 4.2 Importar Proyecto

1. En el Dashboard, haz clic en **"Add new site"** → **"Import an existing project"**
2. Selecciona **"Deploy with GitHub"**
3. Autoriza Netlify y selecciona tu repositorio `supermercado-ecommerce`
4. Configura:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Haz clic en **"Deploy site"**

### 4.3 Configurar Variables de Entorno

1. Ve a **Site settings** → **Environment variables**
2. Añade `VITE_API_URL` con la URL de tu backend en Render

### 4.4 Obtener la URL

Netlify te dará una URL como: `https://random-name-123.netlify.app`

---

## ✅ Paso 5: Verificar el Despliegue

### 5.1 Verificar Backend

1. Abre la URL de tu backend en Render
2. Deberías ver un error 404 o un mensaje (eso es normal, el backend no tiene una ruta raíz)
3. Prueba: `https://tu-backend.onrender.com/api/productos`
4. Deberías ver un JSON con los productos

### 5.2 Verificar Frontend

1. Abre la URL de tu frontend en Vercel/Netlify
2. La aplicación debería cargar correctamente
3. Prueba hacer login y navegar por la aplicación

### 5.3 Verificar CORS

Si ves errores de CORS en la consola del navegador:
1. Asegúrate de que la URL del frontend esté en `ALLOWED_ORIGINS` del backend
2. En Render, ve a **Environment** y actualiza `ALLOWED_ORIGINS` con la URL completa de tu frontend

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

1. **Haz commit y push a GitHub**:
   ```bash
   git add .
   git commit -m "Descripción de los cambios"
   git push
   ```

2. **Vercel/Netlify y Render detectarán automáticamente** los cambios y desplegarán una nueva versión

---

## 🐛 Solución de Problemas

### Error: "Module not found"
- Asegúrate de que `package.json` tenga todas las dependencias
- Ejecuta `npm install` localmente para verificar

### Error: "CORS policy"
- Verifica que la URL del frontend esté en `ALLOWED_ORIGINS` del backend
- Asegúrate de que no haya espacios en la variable de entorno

### Error: "Build failed"
- Revisa los logs en Vercel/Netlify
- Verifica que el comando de build sea correcto
- Asegúrate de que la carpeta `dist` se genere correctamente

### El frontend no se conecta al backend
- Verifica que la URL del backend sea correcta
- Asegúrate de que el backend esté en ejecución (Render puede poner servicios inactivos en el plan gratuito)
- Revisa la configuración de CORS

---

## 📝 Notas Importantes

- **Render (Plan Gratuito)**: Los servicios pueden quedarse inactivos después de 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en "despertar" el servicio.
- **Vercel/Netlify**: Ofrecen planes gratuitos generosos para proyectos personales.
- **Base de Datos**: El archivo SQLite (`supermercado.db`) se guarda en el servidor de Render. Considera hacer backups periódicos.

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en producción. Si tienes problemas, revisa los logs en las plataformas de despliegue o consulta la documentación oficial.

**URLs importantes**:
- Frontend: `https://tu-frontend.vercel.app` (o `.netlify.app`)
- Backend: `https://tu-backend.onrender.com`
- Repositorio: `https://github.com/TU_USUARIO/supermercado-ecommerce`

