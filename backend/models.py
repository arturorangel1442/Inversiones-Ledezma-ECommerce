from peewee import *
import json
from flask_login import UserMixin

# Base de datos SQLite
db = SqliteDatabase('supermercado.db')

class Usuario(UserMixin, Model):
    """Modelo de Usuario para la base de datos"""
    id = AutoField()
    correo = CharField(max_length=100, unique=True, null=False)
    contraseña_hash = CharField(max_length=255, null=False)
    is_admin = BooleanField(default=False)  # Indica si el usuario es administrador
    nombre_usuario = CharField(max_length=100, null=True)  # Nombre de usuario
    direccion_principal = TextField(null=True)  # Dirección de envío por defecto
    
    class Meta:
        database = db
        table_name = 'usuarios'
    
    def __repr__(self):
        return f'<Usuario {self.correo}>'

class Categoria(Model):
    """Modelo de Categoría para la base de datos"""
    id = AutoField()
    nombre = CharField(max_length=100, null=False, unique=True)
    
    class Meta:
        database = db
        table_name = 'categorias'
    
    def __repr__(self):
        return f'<Categoria {self.nombre}>'

class Producto(Model):
    """Modelo de Producto para la base de datos"""
    id = AutoField()
    nombre = CharField(max_length=100, null=False)
    precio = FloatField(null=False)
    stock = IntegerField(null=False)
    imagen_url = CharField(max_length=500, null=True)
    categoria_id = ForeignKeyField(Categoria, backref='productos', null=True, on_delete='SET NULL')
    
    class Meta:
        database = db
        table_name = 'productos'
    
    def __repr__(self):
        return f'<Producto {self.nombre}>'

class Pedido(Model):
    """Modelo de Pedido para la base de datos"""
    id = AutoField()
    usuario_id = ForeignKeyField(Usuario, backref='pedidos', null=True)  # ID del usuario
    total = FloatField(null=False)
    productos_json = TextField(null=False)  # JSON string con los productos del carrito
    estado = CharField(max_length=50, null=False, default='Pendiente')
    fecha_creacion = DateTimeField(null=True)
    referencia_pago = TextField(null=True)  # Referencia de pago móvil
    fecha_confirmacion = DateTimeField(null=True)  # Fecha/hora de confirmación del pago
    motivo_rechazo = TextField(null=True)  # Motivo del rechazo del pago
    direccion_pedido = TextField(null=True)  # Dirección de entrega utilizada en este pedido
    
    class Meta:
        database = db
        table_name = 'pedidos'
    
    def __repr__(self):
        return f'<Pedido {self.id} - {self.estado}>'

class Configuracion(Model):
    """Modelo de Configuración - Solo debe haber un único registro"""
    id = AutoField()
    tasa_bcv = FloatField(null=False, default=36.00)  # Tasa de cambio BCV del día
    
    class Meta:
        database = db
        table_name = 'configuracion'
    
    def __repr__(self):
        return f'<Configuracion tasa_bcv={self.tasa_bcv}>'

def init_db():
    """Inicializa la base de datos con datos de ejemplo si está vacía"""
    try:
        # Conectar a la base de datos
        if db.is_closed():
            db.connect()
        
        # Crear tablas si no existen
        db.create_tables([Usuario, Categoria, Producto, Pedido, Configuracion], safe=True)
        
        # Verificar si hay configuración y crear registro inicial si no existe
        try:
            config = Configuracion.get()
        except Configuracion.DoesNotExist:
            Configuracion.create(tasa_bcv=36.00)
            print('✓ Configuración inicializada con tasa BCV por defecto (36.00)')
        
        # Crear categorías iniciales si no existen
        categorias_iniciales = ['Lácteos', 'Panadería', 'Limpieza', 'Granos y Pastas', 'Frutas y Verduras', 'Carnes', 'Sin Categoría']
        categoria_map = {}
        
        for nombre_cat in categorias_iniciales:
            try:
                categoria = Categoria.get(Categoria.nombre == nombre_cat)
                categoria_map[nombre_cat] = categoria
            except Categoria.DoesNotExist:
                categoria = Categoria.create(nombre=nombre_cat)
                categoria_map[nombre_cat] = categoria
                print(f'✓ Categoría "{nombre_cat}" creada')
        
        # Obtener categoría por defecto
        categoria_default = categoria_map.get('Sin Categoría')
        
        # Verificar si hay productos sin categoría y asignar categorías
        productos_sin_categoria = Producto.select().where(Producto.categoria_id.is_null())
        if productos_sin_categoria.exists():
            # Asignar categorías a productos existentes sin categoría
            for producto in productos_sin_categoria:
                # Asignar categoría según el nombre del producto
                categoria_asignada = categoria_default
                if 'Leche' in producto.nombre or 'Yogur' in producto.nombre:
                    categoria_asignada = categoria_map.get('Lácteos')
                elif 'Huevos' in producto.nombre:
                    categoria_asignada = categoria_map.get('Lácteos')
                elif 'Pan' in producto.nombre:
                    categoria_asignada = categoria_map.get('Panadería')
                elif 'Detergente' in producto.nombre:
                    categoria_asignada = categoria_map.get('Limpieza')
                elif 'Arroz' in producto.nombre or 'Pasta' in producto.nombre:
                    categoria_asignada = categoria_map.get('Granos y Pastas')
                elif 'Aceite' in producto.nombre:
                    categoria_asignada = categoria_map.get('Granos y Pastas')
                elif 'Tomates' in producto.nombre:
                    categoria_asignada = categoria_map.get('Frutas y Verduras')
                elif 'Pollo' in producto.nombre:
                    categoria_asignada = categoria_map.get('Carnes')
                
                producto.categoria_id = categoria_asignada
                producto.save()
            print(f'✓ {productos_sin_categoria.count()} productos actualizados con categorías')
        
        # Verificar si hay productos
        count = Producto.select().count()
        
        if count == 0:
            # Crear productos iniciales con categorías asignadas
            productos_iniciales_data = [
                {'nombre': 'Leche Entera 1L', 'precio': 2.50, 'stock': 50, 'imagen_url': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 'categoria': 'Lácteos'},
                {'nombre': 'Huevos Cartón x12', 'precio': 3.20, 'stock': 30, 'imagen_url': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', 'categoria': 'Lácteos'},
                {'nombre': 'Pan Integral', 'precio': 1.80, 'stock': 40, 'imagen_url': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400', 'categoria': 'Panadería'},
                {'nombre': 'Detergente 1.5L', 'precio': 4.50, 'stock': 25, 'imagen_url': 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400', 'categoria': 'Limpieza'},
                {'nombre': 'Arroz 1kg', 'precio': 1.50, 'stock': 60, 'imagen_url': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 'categoria': 'Granos y Pastas'},
                {'nombre': 'Aceite de Oliva 500ml', 'precio': 5.90, 'stock': 35, 'imagen_url': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 'categoria': 'Granos y Pastas'},
                {'nombre': 'Yogur Natural x4', 'precio': 2.30, 'stock': 45, 'imagen_url': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', 'categoria': 'Lácteos'},
                {'nombre': 'Pasta Espagueti 500g', 'precio': 1.20, 'stock': 55, 'imagen_url': 'https://images.unsplash.com/photo-1551462147-8585ac5aae54?w=400', 'categoria': 'Granos y Pastas'},
                {'nombre': 'Tomates 1kg', 'precio': 2.80, 'stock': 30, 'imagen_url': 'https://images.unsplash.com/photo-1546470427-e26264be0d42?w=400', 'categoria': 'Frutas y Verduras'},
                {'nombre': 'Pollo Pechuga 1kg', 'precio': 6.50, 'stock': 20, 'imagen_url': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400', 'categoria': 'Carnes'},
            ]
            
            # Insertar productos con categorías
            for prod_data in productos_iniciales_data:
                categoria_nombre = prod_data.pop('categoria')
                categoria = categoria_map.get(categoria_nombre, categoria_default)
                Producto.create(
                    nombre=prod_data['nombre'],
                    precio=prod_data['precio'],
                    stock=prod_data['stock'],
                    imagen_url=prod_data['imagen_url'],
                    categoria_id=categoria
                )
            
            print('✓ Base de datos inicializada con productos de ejemplo y categorías')
        else:
            print(f'✓ Base de datos ya contiene {count} productos')
    except Exception as e:
        print(f'Error al inicializar la base de datos: {e}')
        import traceback
        traceback.print_exc()
    finally:
        # Cerrar conexión
        if not db.is_closed():
            db.close()
