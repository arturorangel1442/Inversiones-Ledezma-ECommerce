import { useState, useEffect } from 'react'
import CatalogoProductos from './components/CatalogoProductos'
import CarritoCompras from './components/CarritoCompras'
import ConfirmacionPago from './components/ConfirmacionPago'
import AdminPanel from './components/AdminPanel'
import HistorialPedidos from './components/HistorialPedidos'
import Login from './components/Login'
import Registro from './components/Registro'

function App() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [mostrarAdmin, setMostrarAdmin] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [mostrarLogin, setMostrarLogin] = useState(false)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [pedidoId, setPedidoId] = useState(null)
  const [pedidoTotal, setPedidoTotal] = useState(0)
  const [usuario, setUsuario] = useState(null)
  const [verificandoUsuario, setVerificandoUsuario] = useState(true)

  // Verificar si hay un usuario autenticado al cargar
  useEffect(() => {
    const verificarUsuario = async () => {
      try {
        const response = await fetch('/api/usuario/actual', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setUsuario(data)
        }
      } catch (err) {
        console.error('Error al verificar usuario:', err)
      } finally {
        setVerificandoUsuario(false)
      }
    }
    verificarUsuario()
  }, [])

  // Cargar productos desde la API
  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        setProductos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error al cargar productos:', err)
        setLoading(false)
      })
  }, [])

  // Función para añadir producto al carrito
  const agregarAlCarrito = (producto) => {
    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(item => item.id === producto.id)
      if (existe) {
        // Si ya existe, incrementar cantidad
        return prevCarrito.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      } else {
        // Si no existe, añadirlo con cantidad 1
        return [...prevCarrito, { ...producto, cantidad: 1 }]
      }
    })
  }

  // Función para actualizar cantidad de un producto en el carrito
  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id)
      return
    }
    setCarrito(prevCarrito =>
      prevCarrito.map(item =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      )
    )
  }

  // Función para eliminar producto del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(prevCarrito => prevCarrito.filter(item => item.id !== id))
  }

  // Función para vaciar el carrito
  const vaciarCarrito = () => {
    setCarrito([])
  }

  // Calcular total del carrito
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.precio * item.cantidad, 0)
  }

  // Función para manejar cuando se realiza un pedido
  const handleRealizarPedido = (id, total) => {
    setPedidoId(id)
    setPedidoTotal(total)
    setMostrarConfirmacion(true)
    // Limpiar el carrito después de realizar el pedido
    setCarrito([])
  }

  // Funciones de autenticación
  const handleLoginSuccess = async (data) => {
    setUsuario(data)
    setMostrarLogin(false)
    // Recargar usuario para obtener datos completos
    const response = await fetch('/api/usuario/actual', { credentials: 'include' })
    if (response.ok) {
      const userData = await response.json()
      setUsuario(userData)
    }
  }

  const handleRegisterSuccess = async (data) => {
    setUsuario(data)
    setMostrarRegistro(false)
    // Recargar usuario para obtener datos completos
    const response = await fetch('/api/usuario/actual', { credentials: 'include' })
    if (response.ok) {
      const userData = await response.json()
      setUsuario(userData)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUsuario(null)
      setCarrito([])
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
    }
  }

  // Si se muestra el login, renderizar solo ese componente
  if (mostrarLogin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">🛒 INV LEDEZMA</h1>
            <button
              onClick={() => setMostrarLogin(false)}
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </header>
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => {
            setMostrarLogin(false)
            setMostrarRegistro(true)
          }}
        />
      </div>
    )
  }

  // Si se muestra el registro, renderizar solo ese componente
  if (mostrarRegistro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">🛒 INV LEDEZMA</h1>
            <button
              onClick={() => setMostrarRegistro(false)}
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </header>
        <Registro 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => {
            setMostrarRegistro(false)
            setMostrarLogin(true)
          }}
        />
      </div>
    )
  }

  // Si se muestra el panel de admin, renderizar solo ese componente
  if (mostrarAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">🛒 INV LEDEZMA - Admin</h1>
            <button
              onClick={() => setMostrarAdmin(false)}
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Volver a Tienda
            </button>
          </div>
        </header>
        <AdminPanel />
      </div>
    )
  }

  // Si se muestra el historial, renderizar solo ese componente
  if (mostrarHistorial) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold">🛒 INV LEDEZMA</h1>
            <button
              onClick={() => setMostrarHistorial(false)}
              className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Volver a Tienda
            </button>
          </div>
        </header>
        <HistorialPedidos />
      </div>
    )
  }

  // Si se muestra la confirmación, renderizar solo ese componente
  if (mostrarConfirmacion) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-600 text-white shadow-md">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold">🛒 INV LEDEZMA</h1>
          </div>
        </header>
        <ConfirmacionPago pedidoId={pedidoId} total={pedidoTotal} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">🛒 INV LEDEZMA</h1>
          <div className="flex items-center space-x-4">
            {usuario ? (
              <>
                <span className="text-sm text-gray-200">Hola, {usuario.correo}</span>
                <button
                  onClick={() => setMostrarHistorial(true)}
                  className="text-white hover:text-gray-200 text-sm font-medium underline"
                >
                  Mis Pedidos
                </button>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-200 text-sm font-medium underline"
                >
                  Cerrar Sesión
                </button>
                {usuario.is_admin && (
                  <button
                    onClick={() => setMostrarAdmin(true)}
                    className="text-white hover:text-gray-200 text-sm font-medium underline"
                  >
                    Admin
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setMostrarLogin(true)}
                  className="text-white hover:text-gray-200 text-sm font-medium underline"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setMostrarRegistro(true)}
                  className="text-white hover:text-gray-200 text-sm font-medium underline"
                >
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catálogo de Productos */}
            <div className="lg:col-span-2">
              <CatalogoProductos
                productos={productos}
                onAgregarAlCarrito={agregarAlCarrito}
              />
            </div>

            {/* Carrito de Compras */}
            <div className="lg:col-span-1">
              <CarritoCompras
                carrito={carrito}
                onActualizarCantidad={actualizarCantidad}
                onEliminar={eliminarDelCarrito}
                total={calcularTotal()}
                onRealizarPedido={handleRealizarPedido}
                usuario={usuario}
                onVaciarCarrito={vaciarCarrito}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App


