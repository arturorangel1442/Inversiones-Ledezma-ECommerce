from flask import Flask, jsonify, request, session
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from functools import wraps
from models import db, Producto, Pedido, Usuario, Configuracion, Categoria, init_db
from datetime import datetime
import json
import os
import bcrypt

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configurar Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = "strong"

# Configurar CORS para desarrollo y producción
# Obtener orígenes permitidos desde variables de entorno o usar valores por defecto
def get_allowed_origins():
    """Obtener lista de orígenes permitidos desde variables de entorno"""
    # Orígenes por defecto para desarrollo
    default_origins = [
        'http://127.0.0.1:3000',
        'http://localhost:3000',
    ]
    
    # Orígenes de producción (pueden ser sobrescritos por variable de entorno)
    production_origins = [
        'https://inversionesledezma.vercel.app',
        'https://www.inversionesledezma.vercel.app',
    ]
    
    # Obtener orígenes desde variable de entorno (separados por comas)
    env_origins = os.environ.get('ALLOWED_ORIGINS', '')
    if env_origins:
        # Si se proporciona variable de entorno, usar solo esos orígenes
        custom_origins = [origin.strip() for origin in env_origins.split(',') if origin.strip()]
        # Combinar con orígenes por defecto de desarrollo
        all_origins = default_origins + custom_origins
    else:
        # Si no hay variable de entorno, usar orígenes por defecto + producción
        all_origins = default_origins + production_origins
    
    # Eliminar duplicados manteniendo el orden
    unique_origins = list(dict.fromkeys(all_origins))
    
    return unique_origins

# Obtener orígenes permitidos
allowed_origins = get_allowed_origins()

# Habilitar CORS con orígenes específicos para seguridad
# Esta configuración es compatible con Gunicorn ya que Flask-CORS maneja CORS a nivel de aplicación
CORS(
    app,
    origins=allowed_origins,
    supports_credentials=True,
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    expose_headers=['Content-Type', 'Authorization'],
    max_age=3600  # Cache preflight requests por 1 hora
)

@login_manager.user_loader
def load_user(user_id):
    """Cargar usuario para Flask-Login"""
    try:
        return Usuario.get_by_id(user_id)
    except Usuario.DoesNotExist:
        return None

def admin_required(f):
    """Decorador para verificar que el usuario es administrador"""
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'error': 'Acceso denegado. Se requieren permisos de administrador.'}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def before_request():
    """Abrir conexión a la base de datos antes de cada petición"""
    if db.is_closed():
        db.connect()

@app.after_request
def after_request(response):
    """Cerrar conexión a la base de datos después de cada petición"""
    if not db.is_closed():
        db.close()
    return response
@app.route('/productos', methods=['GET'])
def obtener_productos():
    """Endpoint para obtener todos los productos"""
    try:
        # Obtener todos los productos
        productos = Producto.select()
        
        # Convertir a lista de diccionarios
        productos_list = []
        for p in productos:
            producto_dict = {
                'id': p.id,
                'nombre': p.nombre,
                'precio': float(p.precio),
                'stock': p.stock,
                'imagen_url': p.imagen_url,
                'categoria_id': p.categoria_id.id if p.categoria_id else None,
                'categoria_nombre': p.categoria_id.nombre if p.categoria_id else None
            }
            productos_list.append(producto_dict)
        
        return jsonify(productos_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    """Endpoint para registrar un nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'correo' not in data or 'contraseña' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere correo y contraseña.'}), 400
        
        correo = data['correo'].strip().lower()
        contraseña = data['contraseña']
        
        # Validar formato de correo básico
        if '@' not in correo or len(correo) < 5:
            return jsonify({'error': 'Correo electrónico inválido.'}), 400
        
        # Validar longitud de contraseña
        if len(contraseña) < 6:
            return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres.'}), 400
        
        # Verificar si el correo ya existe
        try:
            Usuario.get(Usuario.correo == correo)
            return jsonify({'error': 'Este correo electrónico ya está registrado.'}), 400
        except Usuario.DoesNotExist:
            pass
        
        # Hashear la contraseña
        contraseña_hash = bcrypt.hashpw(contraseña.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Determinar si el usuario es administrador
        is_admin = (correo == 'admin@inversionesledezma.com')
        
        # Obtener nombre_usuario y direccion_principal (opcionales)
        nombre_usuario = data.get('nombre_usuario', '').strip() if data.get('nombre_usuario') else None
        direccion_principal = data.get('direccion_principal', '').strip() if data.get('direccion_principal') else None
        
        # Crear el usuario
        usuario = Usuario.create(
            correo=correo,
            contraseña_hash=contraseña_hash,
            is_admin=is_admin,
            nombre_usuario=nombre_usuario,
            direccion_principal=direccion_principal
        )
        
        # Iniciar sesión automáticamente
        login_user(usuario)
        
        return jsonify({
            'mensaje': 'Usuario registrado correctamente.',
            'usuario_id': usuario.id,
            'correo': usuario.correo
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint para iniciar sesión"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'correo' not in data or 'contraseña' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere correo y contraseña.'}), 400
        
        correo = data['correo'].strip().lower()
        contraseña = data['contraseña']
        
        # Buscar el usuario
        try:
            usuario = Usuario.get(Usuario.correo == correo)
        except Usuario.DoesNotExist:
            return jsonify({'error': 'Correo o contraseña incorrectos.'}), 401
        
        # Verificar la contraseña
        if not bcrypt.checkpw(contraseña.encode('utf-8'), usuario.contraseña_hash.encode('utf-8')):
            return jsonify({'error': 'Correo o contraseña incorrectos.'}), 401
        
        # Iniciar sesión
        login_user(usuario)
        
        return jsonify({
            'mensaje': 'Sesión iniciada correctamente.',
            'usuario_id': usuario.id,
            'correo': usuario.correo
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    """Endpoint para cerrar sesión"""
    try:
        logout_user()
        return jsonify({'mensaje': 'Sesión cerrada correctamente.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/usuario/actual', methods=['GET'])
def usuario_actual():
    """Endpoint para obtener el usuario actualmente logueado"""
    if current_user.is_authenticated:
        return jsonify({
            'usuario_id': current_user.id,
            'correo': current_user.correo,
            'is_admin': current_user.is_admin,
            'nombre_usuario': current_user.nombre_usuario,
            'direccion_principal': current_user.direccion_principal
        }), 200
    else:
        return jsonify({'error': 'No hay usuario autenticado.'}), 401

@app.route('/api/pedido', methods=['POST'])
@login_required
def crear_pedido():
    """Endpoint para crear un nuevo pedido"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'carrito' not in data or 'total' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere carrito y total.'}), 400
        
        # Validar que se reciba la dirección de entrega
        if 'direccion_pedido' not in data or not data['direccion_pedido'] or not data['direccion_pedido'].strip():
            return jsonify({'error': 'Se requiere una dirección de entrega.'}), 400
        
        carrito = data['carrito']
        total = float(data['total'])
        direccion_pedido = data['direccion_pedido'].strip()
        
        # Validar que el carrito no esté vacío
        if not carrito or len(carrito) == 0:
            return jsonify({'error': 'El carrito está vacío.'}), 400
        
        # Iniciar transacción para validar y restar stock
        with db.atomic():
            # Primero, validar stock de todos los productos
            productos_actualizados = []
            for item in carrito:
                producto_id = item.get('id')
                cantidad_solicitada = item.get('cantidad', 1)
                
                if not producto_id:
                    return jsonify({'error': 'Producto sin ID válido en el carrito.'}), 400
                
                try:
                    producto = Producto.get_by_id(producto_id)
                except Producto.DoesNotExist:
                    return jsonify({'error': f'Producto con ID {producto_id} no encontrado.'}), 404
                
                # Validar que el stock sea suficiente
                if producto.stock < cantidad_solicitada:
                    return jsonify({
                        'error': f'Stock insuficiente para {producto.nombre}. Stock disponible: {producto.stock}, solicitado: {cantidad_solicitada}'
                    }), 400
                
                # Guardar referencia del producto para actualizar después
                productos_actualizados.append({
                    'producto': producto,
                    'cantidad': cantidad_solicitada
                })
            
            # Si todas las validaciones pasaron, restar el stock
            for item in productos_actualizados:
                producto = item['producto']
                cantidad = item['cantidad']
                producto.stock -= cantidad
                producto.save()
            
            # Convertir el carrito a JSON string
            productos_json = json.dumps(carrito)
            
            # Crear el pedido asociado al usuario logueado
            pedido = Pedido.create(
                usuario_id=current_user.id,
                total=total,
                productos_json=productos_json,
                estado='Pendiente',
                fecha_creacion=datetime.now(),
                direccion_pedido=direccion_pedido
            )
        
        # Retornar el pedido creado
        return jsonify({
            'id': pedido.id,
            'total': float(pedido.total),
            'estado': pedido.estado,
            'fecha_creacion': pedido.fecha_creacion.isoformat() if pedido.fecha_creacion else None
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/confirmar_pago', methods=['POST'])
def confirmar_pago():
    """Endpoint para confirmar el pago de un pedido"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'pedido_id' not in data or 'referencia_pago' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere pedido_id y referencia_pago.'}), 400
        
        pedido_id = data['pedido_id']
        referencia_pago = data['referencia_pago'].strip()
        
        # Validar que la referencia tenga entre 4 y 6 dígitos
        if not referencia_pago or len(referencia_pago) < 4 or len(referencia_pago) > 6:
            return jsonify({'error': 'La referencia de pago debe tener entre 4 y 6 dígitos.'}), 400
        
        # Validar que la referencia contenga solo números
        if not referencia_pago.isdigit():
            return jsonify({'error': 'La referencia de pago debe contener solo números.'}), 400
        
        # Buscar el pedido por ID
        try:
            pedido = Pedido.get_by_id(pedido_id)
        except Pedido.DoesNotExist:
            return jsonify({'error': 'Pedido no encontrado.'}), 404
        
        # Actualizar el pedido con la referencia y cambiar el estado
        pedido.referencia_pago = referencia_pago
        pedido.estado = 'Pago Revisión'
        pedido.fecha_confirmacion = datetime.now()
        pedido.save()
        
        # Retornar confirmación
        return jsonify({
            'mensaje': 'Referencia de pago guardada correctamente.',
            'pedido_id': pedido.id,
            'estado': pedido.estado,
            'referencia_pago': pedido.referencia_pago
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pedido/<int:pedido_id>', methods=['GET'])
def obtener_pedido(pedido_id):
    """Endpoint para obtener información esencial de un pedido específico"""
    try:
        # Buscar el pedido por ID
        try:
            pedido = Pedido.get_by_id(pedido_id)
        except Pedido.DoesNotExist:
            return jsonify({'error': 'Pedido no encontrado.'}), 404
        
        # Retornar información esencial
        return jsonify({
            'id': pedido.id,
            'total': float(pedido.total),
            'estado': pedido.estado
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pedidos', methods=['GET'])
@admin_required
def obtener_pedidos():
    """Endpoint para obtener todos los pedidos (Panel de Administración)"""
    try:
        # Obtener todos los pedidos ordenados por fecha de creación (más recientes primero)
        pedidos = Pedido.select().order_by(Pedido.fecha_creacion.desc())
        
        # Convertir a lista de diccionarios
        pedidos_list = []
        for pedido in pedidos:
            # Parsear los productos del JSON
            try:
                productos = json.loads(pedido.productos_json)
            except:
                productos = []
            
            # Obtener información del usuario asociado
            nombre_usuario = None
            if pedido.usuario_id:
                try:
                    usuario = Usuario.get_by_id(pedido.usuario_id.id)
                    nombre_usuario = usuario.nombre_usuario
                except Usuario.DoesNotExist:
                    pass
            
            pedidos_list.append({
                'id': pedido.id,
                'total': float(pedido.total),
                'estado': pedido.estado,
                'productos': productos,
                'referencia_pago': pedido.referencia_pago,
                'motivo_rechazo': pedido.motivo_rechazo,
                'direccion_pedido': pedido.direccion_pedido,
                'nombre_usuario': nombre_usuario,
                'fecha_creacion': pedido.fecha_creacion.isoformat() if pedido.fecha_creacion else None,
                'fecha_confirmacion': pedido.fecha_confirmacion.isoformat() if pedido.fecha_confirmacion else None
            })
        
        return jsonify(pedidos_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pedido/actualizar_estado', methods=['POST'])
@admin_required
def actualizar_estado_pedido():
    """Endpoint para actualizar el estado de un pedido"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'pedido_id' not in data or 'nuevo_estado' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere pedido_id y nuevo_estado.'}), 400
        
        pedido_id = data['pedido_id']
        nuevo_estado = data['nuevo_estado']
        
        # Validar que el nuevo estado sea válido
        estados_validos = ['Pendiente', 'Pago Revisión', 'Pago Rechazado', 'Enviado', 'Entregado']
        if nuevo_estado not in estados_validos:
            return jsonify({'error': f'Estado inválido. Estados válidos: {", ".join(estados_validos)}'}), 400
        
        # Si el estado es 'Pago Rechazado', validar que se proporcione motivo_rechazo
        if nuevo_estado == 'Pago Rechazado':
            if 'motivo_rechazo' not in data or not data['motivo_rechazo'] or len(data['motivo_rechazo'].strip()) == 0:
                return jsonify({'error': 'Se requiere un motivo de rechazo cuando el estado es "Pago Rechazado".'}), 400
        
        # Buscar el pedido por ID
        try:
            pedido = Pedido.get_by_id(pedido_id)
        except Pedido.DoesNotExist:
            return jsonify({'error': 'Pedido no encontrado.'}), 404
        
        # Actualizar el estado del pedido
        pedido.estado = nuevo_estado
        
        # Si el estado es 'Pago Rechazado', guardar el motivo
        if nuevo_estado == 'Pago Rechazado':
            pedido.motivo_rechazo = data['motivo_rechazo'].strip()
        else:
            # Si cambia a otro estado, limpiar el motivo de rechazo
            pedido.motivo_rechazo = None
        
        pedido.save()
        
        # Retornar confirmación
        return jsonify({
            'mensaje': 'Estado del pedido actualizado correctamente.',
            'pedido_id': pedido.id,
            'estado': pedido.estado
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/pedidos/mis-pedidos', methods=['GET'])
@login_required
def obtener_pedidos_usuario():
    """Endpoint para obtener todos los pedidos del usuario actual"""
    try:
        # Buscar todos los pedidos del usuario ordenados por fecha de creación (más recientes primero)
        pedidos = Pedido.select().where(Pedido.usuario_id == current_user.id).order_by(Pedido.fecha_creacion.desc())
        
        # Convertir a lista de diccionarios
        pedidos_list = []
        for pedido in pedidos:
            # Parsear los productos del JSON
            try:
                productos = json.loads(pedido.productos_json)
            except:
                productos = []
            
            pedidos_list.append({
                'id': pedido.id,
                'total': float(pedido.total),
                'estado': pedido.estado,
                'productos': productos,
                'referencia_pago': pedido.referencia_pago,
                'motivo_rechazo': pedido.motivo_rechazo,
                'fecha_creacion': pedido.fecha_creacion.isoformat() if pedido.fecha_creacion else None,
                'fecha_confirmacion': pedido.fecha_confirmacion.isoformat() if pedido.fecha_confirmacion else None
            })
        
        return jsonify(pedidos_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos', methods=['POST'])
@admin_required
def crear_producto():
    """Endpoint para crear un nuevo producto (solo administradores)"""
    try:
        data = request.get_json()
        
        # Validar que se reciban los datos necesarios
        if not data or 'nombre' not in data or 'precio' not in data or 'stock' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere nombre, precio y stock.'}), 400
        
        nombre = data['nombre'].strip()
        precio = float(data['precio'])
        stock = int(data['stock'])
        imagen_url = data.get('imagen_url', '').strip() if data.get('imagen_url') else None
        
        # Validar que los datos sean válidos
        if not nombre or len(nombre) == 0:
            return jsonify({'error': 'El nombre del producto es obligatorio.'}), 400
        
        if precio < 0:
            return jsonify({'error': 'El precio debe ser mayor o igual a 0.'}), 400
        
        if stock < 0:
            return jsonify({'error': 'El stock debe ser mayor o igual a 0.'}), 400
        
        # Obtener categoría si se proporciona
        categoria_id = None
        if 'categoria_id' in data and data['categoria_id']:
            try:
                categoria = Categoria.get_by_id(data['categoria_id'])
                categoria_id = categoria.id
            except Categoria.DoesNotExist:
                return jsonify({'error': 'Categoría no encontrada.'}), 400
        
        # Crear el producto
        producto = Producto.create(
            nombre=nombre,
            precio=precio,
            stock=stock,
            imagen_url=imagen_url,
            categoria_id=categoria_id
        )
        
        # Retornar el producto creado
        return jsonify({
            'id': producto.id,
            'nombre': producto.nombre,
            'precio': float(producto.precio),
            'stock': producto.stock,
            'imagen_url': producto.imagen_url,
            'categoria_id': producto.categoria_id.id if producto.categoria_id else None,
            'categoria_nombre': producto.categoria_id.nombre if producto.categoria_id else None
        }), 201
        
    except ValueError:
        return jsonify({'error': 'Precio o stock inválidos. Deben ser números.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos/<int:producto_id>', methods=['PUT'])
@admin_required
def actualizar_producto(producto_id):
    """Endpoint para actualizar un producto existente (solo administradores)"""
    try:
        data = request.get_json()
        
        # Buscar el producto por ID
        try:
            producto = Producto.get_by_id(producto_id)
        except Producto.DoesNotExist:
            return jsonify({'error': 'Producto no encontrado.'}), 404
        
        # Validar y actualizar los campos proporcionados
        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if not nombre or len(nombre) == 0:
                return jsonify({'error': 'El nombre del producto no puede estar vacío.'}), 400
            producto.nombre = nombre
        
        if 'precio' in data:
            precio = float(data['precio'])
            if precio < 0:
                return jsonify({'error': 'El precio debe ser mayor o igual a 0.'}), 400
            producto.precio = precio
        
        if 'stock' in data:
            stock = int(data['stock'])
            if stock < 0:
                return jsonify({'error': 'El stock debe ser mayor o igual a 0.'}), 400
            producto.stock = stock
        
        if 'imagen_url' in data:
            imagen_url = data['imagen_url'].strip() if data['imagen_url'] else None
            producto.imagen_url = imagen_url
        
        if 'categoria_id' in data:
            if data['categoria_id'] is None:
                producto.categoria_id = None
            else:
                try:
                    categoria = Categoria.get_by_id(data['categoria_id'])
                    producto.categoria_id = categoria.id
                except Categoria.DoesNotExist:
                    return jsonify({'error': 'Categoría no encontrada.'}), 400
        
        # Guardar los cambios
        producto.save()
        
        # Retornar el producto actualizado
        return jsonify({
            'id': producto.id,
            'nombre': producto.nombre,
            'precio': float(producto.precio),
            'stock': producto.stock,
            'imagen_url': producto.imagen_url,
            'categoria_id': producto.categoria_id.id if producto.categoria_id else None,
            'categoria_nombre': producto.categoria_id.nombre if producto.categoria_id else None
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Precio o stock inválidos. Deben ser números.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/productos/<int:producto_id>', methods=['DELETE'])
@admin_required
def eliminar_producto(producto_id):
    """Endpoint para eliminar un producto (solo administradores)"""
    try:
        # Buscar el producto por ID
        try:
            producto = Producto.get_by_id(producto_id)
        except Producto.DoesNotExist:
            return jsonify({'error': 'Producto no encontrado.'}), 404
        
        # Eliminar el producto
        producto.delete_instance()
        
        # Retornar confirmación
        return jsonify({
            'mensaje': 'Producto eliminado correctamente.',
            'id': producto_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/configuracion/tasa', methods=['GET'])
def obtener_tasa_bcv():
    """Endpoint para obtener la tasa BCV actual"""
    try:
        # Obtener el único registro de configuración
        config = Configuracion.get()
        return jsonify({
            'tasa_bcv': float(config.tasa_bcv)
        }), 200
    except Configuracion.DoesNotExist:
        # Si no existe, crear con valor por defecto
        config = Configuracion.create(tasa_bcv=36.00)
        return jsonify({
            'tasa_bcv': float(config.tasa_bcv)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/configuracion/tasa', methods=['PUT'])
@admin_required
def actualizar_tasa_bcv():
    """Endpoint para actualizar la tasa BCV (solo administradores)"""
    try:
        data = request.get_json()
        
        # Validar que se reciba la tasa
        if not data or 'tasa_bcv' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere tasa_bcv.'}), 400
        
        tasa_bcv = float(data['tasa_bcv'])
        
        # Validar que la tasa sea un número positivo
        if tasa_bcv <= 0:
            return jsonify({'error': 'La tasa BCV debe ser un número mayor que 0.'}), 400
        
        # Obtener el único registro de configuración
        try:
            config = Configuracion.get()
            config.tasa_bcv = tasa_bcv
            config.save()
        except Configuracion.DoesNotExist:
            # Si no existe, crear con el nuevo valor
            config = Configuracion.create(tasa_bcv=tasa_bcv)
        
        # Retornar la configuración actualizada
        return jsonify({
            'mensaje': 'Tasa BCV actualizada correctamente.',
            'tasa_bcv': float(config.tasa_bcv)
        }), 200
        
    except ValueError:
        return jsonify({'error': 'La tasa BCV debe ser un número válido.'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categorias', methods=['GET'])
def obtener_categorias():
    """Endpoint para obtener todas las categorías"""
    try:
        categorias = Categoria.select().order_by(Categoria.nombre)
        categorias_list = [{
            'id': c.id,
            'nombre': c.nombre
        } for c in categorias]
        return jsonify(categorias_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categorias', methods=['POST'])
@admin_required
def crear_categoria():
    """Endpoint para crear una nueva categoría (solo administradores)"""
    try:
        data = request.get_json()
        
        if not data or 'nombre' not in data:
            return jsonify({'error': 'Datos incompletos. Se requiere nombre.'}), 400
        
        nombre = data['nombre'].strip()
        
        if not nombre or len(nombre) == 0:
            return jsonify({'error': 'El nombre de la categoría es obligatorio.'}), 400
        
        # Verificar si ya existe una categoría con ese nombre
        try:
            Categoria.get(Categoria.nombre == nombre)
            return jsonify({'error': 'Ya existe una categoría con ese nombre.'}), 400
        except Categoria.DoesNotExist:
            pass
        
        # Crear la categoría
        categoria = Categoria.create(nombre=nombre)
        
        return jsonify({
            'id': categoria.id,
            'nombre': categoria.nombre
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categorias/<int:categoria_id>', methods=['PUT'])
@admin_required
def actualizar_categoria(categoria_id):
    """Endpoint para actualizar una categoría existente (solo administradores)"""
    try:
        data = request.get_json()
        
        # Buscar la categoría por ID
        try:
            categoria = Categoria.get_by_id(categoria_id)
        except Categoria.DoesNotExist:
            return jsonify({'error': 'Categoría no encontrada.'}), 404
        
        if 'nombre' in data:
            nombre = data['nombre'].strip()
            if not nombre or len(nombre) == 0:
                return jsonify({'error': 'El nombre de la categoría no puede estar vacío.'}), 400
            
            # Verificar si ya existe otra categoría con ese nombre
            try:
                categoria_existente = Categoria.get((Categoria.nombre == nombre) & (Categoria.id != categoria_id))
                return jsonify({'error': 'Ya existe otra categoría con ese nombre.'}), 400
            except Categoria.DoesNotExist:
                pass
            
            categoria.nombre = nombre
            categoria.save()
        
        return jsonify({
            'id': categoria.id,
            'nombre': categoria.nombre
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categorias/<int:categoria_id>', methods=['DELETE'])
@admin_required
def eliminar_categoria(categoria_id):
    """Endpoint para eliminar una categoría (solo administradores)"""
    try:
        # Buscar la categoría por ID
        try:
            categoria = Categoria.get_by_id(categoria_id)
        except Categoria.DoesNotExist:
            return jsonify({'error': 'Categoría no encontrada.'}), 404
        
        # Verificar si hay productos usando esta categoría
        productos_count = Producto.select().where(Producto.categoria_id == categoria_id).count()
        if productos_count > 0:
            # Obtener categoría "Sin Categoría" o crear una si no existe
            try:
                categoria_default = Categoria.get(Categoria.nombre == 'Sin Categoría')
            except Categoria.DoesNotExist:
                categoria_default = Categoria.create(nombre='Sin Categoría')
            
            # Reasignar productos a "Sin Categoría"
            Producto.update(categoria_id=categoria_default).where(Producto.categoria_id == categoria_id).execute()
        
        # Eliminar la categoría
        categoria.delete_instance()
        
        return jsonify({
            'mensaje': 'Categoría eliminada correctamente.',
            'id': categoria_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Manejar errores de autenticación
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Debes iniciar sesión para acceder a este recurso.'}), 401

if __name__ == '__main__':
    # Inicializar base de datos y datos de ejemplo
    init_db()
    
    # Ejecutar servidor
    app.run(debug=True, port=5000)
