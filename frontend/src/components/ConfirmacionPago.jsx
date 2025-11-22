import { useState, useEffect } from 'react'

function ConfirmacionPago({ pedidoId, total }) {
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [referenciaEnviada, setReferenciaEnviada] = useState(false)
  const [error, setError] = useState('')
  const [estadoPedido, setEstadoPedido] = useState(null)
  const [cargandoEstado, setCargandoEstado] = useState(true)
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

  // Cargar el estado del pedido cuando se monta el componente
  useEffect(() => {
    const cargarEstadoPedido = async () => {
      if (!pedidoId) return

      try {
        setCargandoEstado(true)
        const response = await fetch(`/api/pedido/${pedidoId}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar el estado del pedido')
        }
        
        const data = await response.json()
        setEstadoPedido(data.estado)
      } catch (err) {
        console.error('Error al cargar estado del pedido:', err)
      } finally {
        setCargandoEstado(false)
      }
    }

    cargarEstadoPedido()
  }, [pedidoId])

  // Recargar el estado después de enviar la referencia
  useEffect(() => {
    if (referenciaEnviada && pedidoId) {
      const cargarEstadoPedido = async () => {
        try {
          const response = await fetch(`/api/pedido/${pedidoId}`)
          if (response.ok) {
            const data = await response.json()
            setEstadoPedido(data.estado)
          }
        } catch (err) {
          console.error('Error al recargar estado del pedido:', err)
        }
      }
      cargarEstadoPedido()
    }
  }, [referenciaEnviada, pedidoId])

  const handleEnviarReferencia = async (e) => {
    e.preventDefault()
    
    // Validar que la referencia tenga entre 4 y 6 dígitos
    if (!referencia || referencia.length < 4 || referencia.length > 6) {
      setError('La referencia debe tener entre 4 y 6 dígitos')
      return
    }

    // Validar que solo contenga números
    if (!/^\d+$/.test(referencia)) {
      setError('La referencia debe contener solo números')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/confirmar_pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          referencia_pago: referencia
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar la referencia')
      }

      // Si todo está bien, marcar como enviada y recargar el estado
      setReferenciaEnviada(true)
      // Recargar el estado del pedido
      const estadoResponse = await fetch(`/api/pedido/${pedidoId}`)
      if (estadoResponse.ok) {
        const estadoData = await estadoResponse.json()
        setEstadoPedido(estadoData.estado)
      }
    } catch (error) {
      console.error('Error al enviar referencia:', error)
      setError(error.message)
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
      case 'Enviado':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'Entregado':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const handleVolverAlInicio = () => {
    // Guardar la URL de seguimiento en LocalStorage
    if (pedidoId) {
      const urlSeguimiento = `/seguimiento/${pedidoId}`
      localStorage.setItem('ultimoPedidoSeguimiento', urlSeguimiento)
      localStorage.setItem('ultimoPedidoId', pedidoId.toString())
    }
    // Recargar la página para volver al inicio
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {referenciaEnviada ? 'Referencia Enviada' : 'Pedido Guardado'}
          </h2>
          <p className="text-gray-600">
            {referenciaEnviada 
              ? 'Su pago será revisado.' 
              : 'Por favor, realiza el Pago Móvil a estos datos para completar tu orden, y luego envía la captura de referencia.'}
          </p>
        </div>

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
            <div className="flex justify-between items-center py-2 border-b border-green-200">
              <span className="font-semibold text-gray-700">Teléfono:</span>
              <span className="text-gray-800 font-medium">04124445259</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-gray-700">Total a Pagar:</span>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-bold text-green-600">
                  ${total ? total.toFixed(2) : '0.00'}
                </span>
                <span className="text-sm text-gray-600">
                  Bs. {total ? (total * tasaBcv).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {pedidoId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 text-center mb-2">
              <span className="font-semibold">Número de Pedido:</span> #{pedidoId}
            </p>
            {cargandoEstado ? (
              <p className="text-xs text-gray-500 text-center">Cargando estado...</p>
            ) : estadoPedido ? (
              <div className="mt-3 text-center">
                <p className="text-sm font-semibold text-gray-700 mb-2">Estado actual:</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getEstadoColor(estadoPedido)}`}>
                  {estadoPedido}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {!referenciaEnviada && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
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
                    setError('')
                  }}
                  maxLength={6}
                  placeholder="Ej: 123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  disabled={loading}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !referencia}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Enviando...' : 'Enviar Referencia'}
              </button>
            </form>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleVolverAlInicio}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmacionPago

