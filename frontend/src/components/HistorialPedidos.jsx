import { useState, useEffect } from 'react'

function HistorialPedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [referencia, setReferencia] = useState('')
  const [enviandoReferencia, setEnviandoReferencia] = useState(false)
  const [errorReferencia, setErrorReferencia] = useState('')
  const [tasaBcv, setTasaBcv] = useState(36.00)

  // Cargar pedidos del usuario desde la API
  useEffect(() => {
    cargarPedidos()
    cargarTasaBcv()
  }, [])
  
  // Cargar tasa BCV
  const cargarTasaBcv = async () => {
    try {
      const response = await fetch('/api/configuracion/tasa')
      if (response.ok) {
        const data = await response.json()
        setTasaBcv(data.tasa_bcv)
      }
    } catch (err) {
      console.error('Error al cargar tasa BCV:', err)
    }
  }

  const cargarPedidos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pedidos/mis-pedidos', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Debes iniciar sesión para ver tus pedidos')
        }
        throw new Error('Error al cargar los pedidos')
      }
      
      const data = await response.json()
      setPedidos(data)
      setError('')
    } catch (err) {
      console.error('Error al cargar pedidos:', err)
      setError(err.message || 'Error al cargar los pedidos. Por favor, recarga la página.')
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Pago Revisión':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Pago Rechazado':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Enviado':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Entregado':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A'
    const fecha = new Date(fechaISO)
    return fecha.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleConfirmarPago = (pedido) => {
    setPedidoSeleccionado(pedido)
    setReferencia('')
    setErrorReferencia('')
  }

  const handleCerrarModal = () => {
    setPedidoSeleccionado(null)
    setReferencia('')
    setErrorReferencia('')
  }

  const handleEnviarReferencia = async (e) => {
    e.preventDefault()
    
    if (!pedidoSeleccionado) return

    // Validar que la referencia tenga entre 4 y 6 dígitos
    if (!referencia || referencia.length < 4 || referencia.length > 6) {
      setErrorReferencia('La referencia debe tener entre 4 y 6 dígitos')
      return
    }

    // Validar que solo contenga números
    if (!/^\d+$/.test(referencia)) {
      setErrorReferencia('La referencia debe contener solo números')
      return
    }

    setErrorReferencia('')
    setEnviandoReferencia(true)

    try {
      const response = await fetch('/api/confirmar_pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pedido_id: pedidoSeleccionado.id,
          referencia_pago: referencia
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar la referencia')
      }

      // Actualizar el estado del pedido en la lista
      setPedidos(prevPedidos =>
        prevPedidos.map(pedido =>
          pedido.id === pedidoSeleccionado.id
            ? { ...pedido, estado: 'Pago Revisión', referencia_pago: referencia }
            : pedido
        )
      )

      // Cerrar el modal
      handleCerrarModal()
    } catch (error) {
      console.error('Error al enviar referencia:', error)
      setErrorReferencia(error.message)
    } finally {
      setEnviandoReferencia(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <p className="text-xl text-gray-600">Cargando tu historial de pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">Historial de todos tus pedidos realizados</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No tienes pedidos registrados</p>
            <p className="text-gray-500 text-sm mt-2">Realiza tu primer pedido para verlo aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Pedido #{pedido.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Fecha: {formatearFecha(pedido.fecha_creacion)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getEstadoColor(pedido.estado)}`}>
                      {pedido.estado}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-green-600">
                        ${pedido.total.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Bs. {(pedido.total * tasaBcv).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {pedido.productos && pedido.productos.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Productos:</h4>
                    <ul className="space-y-1">
                      {pedido.productos.map((producto, index) => (
                        <li key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{producto.nombre}</span>
                          <div className="flex flex-col items-end">
                            <span className="font-medium">
                              x{producto.cantidad} - ${(producto.precio * producto.cantidad).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Bs. {((producto.precio * producto.cantidad) * tasaBcv).toFixed(2)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {pedido.referencia_pago && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Referencia de pago:</span> {pedido.referencia_pago}
                    </p>
                  </div>
                )}

                {pedido.estado === 'Pago Rechazado' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start">
                        <svg
                          className="h-5 w-5 text-red-600 mr-2 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-800 mb-1">
                            Pago No Confirmado
                          </p>
                          <p className="text-sm text-red-700 mb-2">
                            Contacte a Soporte para más información.
                          </p>
                          {pedido.motivo_rechazo && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <p className="text-xs font-semibold text-red-800 mb-1">Motivo:</p>
                              <p className="text-sm text-red-700 italic">
                                {pedido.motivo_rechazo}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConfirmarPago(pedido)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Reintentar Pago
                    </button>
                  </div>
                )}

                {(pedido.estado === 'Pendiente' || pedido.estado === 'Pago Revisión') && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <button
                      onClick={() => handleConfirmarPago(pedido)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Confirmar Pago Móvil
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal de Confirmación de Pago */}
        {pedidoSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Confirmar Pago Móvil</h2>
                  <button
                    onClick={handleCerrarModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* Información del Pedido */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700">Número de Pedido:</span>
                    <span className="text-lg font-bold text-gray-800">#{pedidoSeleccionado.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total a Pagar:</span>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-bold text-green-600">
                        ${pedidoSeleccionado.total.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Bs. {(pedidoSeleccionado.total * tasaBcv).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información de Pago Móvil */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    Información de Pago Móvil
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="font-semibold text-gray-700">Banco:</span>
                      <span className="text-gray-800 font-medium">Mercantil (0105)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="font-semibold text-gray-700">Cédula/RIF:</span>
                      <span className="text-gray-800 font-medium">32618802</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-semibold text-gray-700">Teléfono:</span>
                      <span className="text-gray-800 font-medium">04124445259</span>
                    </div>
                  </div>
                </div>

                {/* Formulario de Referencia */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                    Enviar Referencia de Pago
                  </h3>
                  <form onSubmit={handleEnviarReferencia}>
                    <div className="mb-4">
                      <label htmlFor="referencia" className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Referencia (4-6 dígitos)
                      </label>
                      <input
                        type="text"
                        id="referencia"
                        value={referencia}
                        onChange={(e) => {
                          setReferencia(e.target.value)
                          setErrorReferencia('')
                        }}
                        maxLength={6}
                        placeholder="Ej: 123456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                        disabled={enviandoReferencia}
                      />
                      {errorReferencia && (
                        <p className="mt-2 text-sm text-red-600">{errorReferencia}</p>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleCerrarModal}
                        className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
                        disabled={enviandoReferencia}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={enviandoReferencia || !referencia}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                      >
                        {enviandoReferencia ? 'Enviando...' : 'Enviar Referencia'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={cargarPedidos}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistorialPedidos

