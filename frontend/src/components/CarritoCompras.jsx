import { useState, useEffect } from 'react'

function CarritoCompras({ carrito, onActualizarCantidad, onEliminar, total, onRealizarPedido, usuario, onVaciarCarrito }) {
  const [loading, setLoading] = useState(false)
  const [mostrarModalDireccion, setMostrarModalDireccion] = useState(false)
  const [direccionEntrega, setDireccionEntrega] = useState('')
  const [tasaBcv, setTasaBcv] = useState(36.00)
  
  // Cargar tasa BCV al montar el componente
  useEffect(() => {
    const cargarTasaBcv = async () => {
      try {
        const response = await fetch('https://inversiones-ledezma-ecommerce.onrender.com/api/configuracion/tasa')
        if (response.ok) {
          const data = await response.json()
          setTasaBcv(data.tasa_bcv)
        }
      } catch (err) {
        console.error('Error al cargar tasa BCV:', err)
      }
    }
    cargarTasaBcv()
  }, [])

  const handleRealizarPedido = () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío')
      return
    }

    if (!usuario) {
      alert('Debes iniciar sesión para realizar un pedido')
      return
    }

    // Prellenar la dirección con la dirección principal del usuario si existe
    const direccionPrellenada = usuario.direccion_principal || ''
    setDireccionEntrega(direccionPrellenada)
    setMostrarModalDireccion(true)
  }

  const handleConfirmarDireccionYPagar = async () => {
    if (!direccionEntrega.trim()) {
      alert('Por favor, ingresa una dirección de entrega')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/pedido', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          carrito: carrito,
          total: total,
          direccion_pedido: direccionEntrega.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al realizar el pedido')
      }

      const pedidoData = await response.json()
      
      // Vaciar el carrito después de crear el pedido exitosamente
      if (onVaciarCarrito) {
        onVaciarCarrito()
      }
      
      // Cerrar el modal
      setMostrarModalDireccion(false)
      
      // Llamar a la función callback para navegar a la página de confirmación
      if (onRealizarPedido) {
        onRealizarPedido(pedidoData.id, total)
      }
    } catch (error) {
      console.error('Error al realizar pedido:', error)
      alert('Error al realizar el pedido: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Modal de Confirmación de Dirección */}
      {mostrarModalDireccion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Confirmar Dirección de Entrega</h3>
            
            <div className="mb-4">
              <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Entrega
              </label>
              <textarea
                id="direccion"
                value={direccionEntrega}
                onChange={(e) => setDireccionEntrega(e.target.value)}
                placeholder="Ingresa tu dirección completa (calle, número, ciudad, código postal)"
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                disabled={loading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setMostrarModalDireccion(false)
                  setDireccionEntrega('')
                }}
                disabled={loading}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarDireccionYPagar}
                disabled={loading || !direccionEntrega.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Procesando...' : 'Confirmar Dirección y Pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Carrito de Compras</h2>

        {carrito.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Tu carrito está vacío</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {carrito.map(item => (
              <div
                key={item.id}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{item.nombre}</h3>
                  <button
                    onClick={() => onEliminar(item.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                    aria-label="Eliminar producto"
                  >
                    ×
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onActualizarCantidad(item.id, item.cantidad - 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => onActualizarCantidad(item.id, item.cantidad + 1)}
                      className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-gray-800">
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-600">
                      Bs. {((item.precio * item.cantidad) * tasaBcv).toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  ${item.precio.toFixed(2)} cada uno (Bs. {(item.precio * tasaBcv).toFixed(2)})
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold text-gray-800">Total:</span>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-green-600">
                  ${total.toFixed(2)}
                </span>
                <span className="text-sm text-gray-600">
                  Bs. {(total * tasaBcv).toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleRealizarPedido}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Procesando...' : 'Realizar Pedido'}
            </button>
          </div>
        </>
      )}
      </div>
    </>
  )
}

export default CarritoCompras


