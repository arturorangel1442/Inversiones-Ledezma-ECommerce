# Aplicación de E-commerce para Supermercado

Aplicación completa de e-commerce con React (frontend) y Flask (backend).

## Ubicación del Proyecto

**Ruta completa:** `C:\Users\Usuario\Desktop\supermercado-ecommerce`

## Estructura del Proyecto

```
supermercado-ecommerce/
├── backend/              # API Flask
│   ├── app.py           # Aplicación principal Flask
│   ├── models.py        # Modelos de base de datos (SQLAlchemy)
│   └── requirements.txt # Dependencias Python
│
└── frontend/            # Aplicación React + Vite
    ├── src/
    │   ├── components/
    │   │   ├── CatalogoProductos.jsx
    │   │   └── CarritoCompras.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── postcss.config.js
```

## Instalación y Ejecución

### Backend (Flask)

1. Navega a la carpeta `backend`:
```bash
cd C:\Users\Usuario\Desktop\supermercado-ecommerce\backend
```

2. Crea un entorno virtual (recomendado):
```bash
python -m venv venv
```

3. Activa el entorno virtual:
```bash
venv\Scripts\activate
```

4. Instala las dependencias:
```bash
pip install -r requirements.txt
```

5. Ejecuta el servidor:
```bash
python app.py
```

El servidor estará disponible en `http://localhost:5000`

### Frontend (React + Vite)

1. Navega a la carpeta `frontend`:
```bash
cd C:\Users\Usuario\Desktop\supermercado-ecommerce\frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Funcionalidades

### Backend
- ✅ API RESTful con Flask
- ✅ Base de datos SQLite con Peewee ORM (compatible con Python 3.14)
- ✅ Endpoint `GET /api/productos` para listar productos
- ✅ Datos iniciales (seed) con 10 productos de supermercado
- ✅ CORS habilitado para comunicación con el frontend

### Frontend
- ✅ Catálogo de productos con búsqueda
- ✅ Carrito de compras con gestión de cantidades
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Manejo de estado con React Hooks (useState)

## Productos Incluidos

El sistema viene con 10 productos pre-cargados:
1. Leche Entera 1L
2. Huevos Cartón x12
3. Pan Integral
4. Detergente 1.5L
5. Arroz 1kg
6. Aceite de Oliva 500ml
7. Yogur Natural x4
8. Pasta Espagueti 500g
9. Tomates 1kg
10. Pollo Pechuga 1kg

## Notas Técnicas

- El backend utiliza **Peewee ORM** con SQLite como base de datos (compatible con Python 3.14)
- El archivo `supermercado.db` se crea automáticamente en la carpeta `backend`
- El frontend está configurado con proxy para las peticiones a `/api` hacia `http://localhost:5000`
- Los productos incluyen imágenes de Unsplash (fallback si no están disponibles)
- Se cambió de SQLAlchemy a Peewee debido a problemas de compatibilidad con Python 3.14

