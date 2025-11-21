import { useState, useEffect } from 'react'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('pedidos') // 'pedidos', 'productos' o 'categorias'
  
  // Estados para pedidos
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actualizando, setActualizando] = useState({})
  const [pedidoRechazar, setPedidoRechazar] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  
  // Estados para productos
  const [productos, setProductos] = useState([])
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [errorProductos, setErrorProductos] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [productoEditando, setProductoEditando] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    precio: '',
    stock: '',
    imagen_url: ''
  })
  const [errorFormulario, setErrorFormulario] = useState('')
  
  // Estados para tasa BCV
  const [tasaBcv, setTasaBcv] = useState(36.00)
  const [tasaBcvInput, setTasaBcvInput] = useState('36.00')
  const [actualizandoTasa, setActualizandoTasa] = useState(false)
  const [errorTasa, setErrorTasa] = useState('')
  
  // Estados para categorías
  const [categorias, setCategorias] = useState([])
  const [loadingCategorias, setLoadingCategorias] = useState(false)
  const [errorCategorias, setErrorCategorias] = useState('')
  const [mostrarFormularioCategoria, setMostrarFormularioCategoria] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [nombreCategoria, setNombreCategoria] = useState('')
  const [errorCategoriaForm, setErrorCategoriaForm] = useState('')

  // Cargar pedidos desde la API
  useEffect(() => {
    cargarPedidos()
    cargarTasaBcv()
  }, [])
  
  // Cargar productos cuando se selecciona la pestaña de productos
  useEffect(() => {
    if (activeTab === 'productos') {
      cargarProductos()
      cargarCategorias()
    }
    if (activeTab === 'categorias') {
      cargarCategorias()
    }
  }, [activeTab])

  const cargarPedidos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pedidos')
      
      if (!response.ok) {
        throw new Error('Error al cargar los pedidos')
      }
      
      const data = await response.json()
      setPedidos(data)
      setError('')
    } catch (err) {
      console.error('Error al cargar pedidos:', err)
      setError('Error al cargar los pedidos. Por favor, recarga la página.')
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstado = async (pedidoId, nuevoEstado, motivoRechazo = null) => {
    try {
      setActualizando(prev => ({ ...prev, [pedidoId]: true }))
      
      const body = {
        pedido_id: pedidoId,
        nuevo_estado: nuevoEstado
      }
      
      // Si el estado es 'Pago Rechazado', incluir el motivo
      if (nuevoEstado === 'Pago Rechazado' && motivoRechazo) {
        body.motivo_rechazo = motivoRechazo
      }
      
      const response = await fetch('/api/pedido/actualizar_estado', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el estado')
      }

      // Recargar la lista de pedidos
      await cargarPedidos()
      
      // Cerrar el modal si estaba abierto
      if (nuevoEstado === 'Pago Rechazado') {
        setPedidoRechazar(null)
        setMotivoRechazo('')
        setErrorMotivo('')
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err)
      alert('Error al actualizar el estado: ' + err.message)
    } finally {
      setActualizando(prev => ({ ...prev, [pedidoId]: false }))
    }
  }

  const handleRechazarPago = (pedido) => {
    setPedidoRechazar(pedido)
    setMotivoRechazo('')
    setErrorMotivo('')
  }

  const handleCerrarModalRechazo = () => {
    setPedidoRechazar(null)
    setMotivoRechazo('')
    setErrorMotivo('')
  }

  const handleConfirmarRechazo = async () => {
    if (!pedidoRechazar) return

    // Validar que se haya ingresado un motivo
    if (!motivoRechazo || motivoRechazo.trim().length === 0) {
      setErrorMotivo('Debe ingresar un motivo de rechazo')
      return
    }

    setErrorMotivo('')
    await actualizarEstado(pedidoRechazar.id, 'Pago Rechazado', motivoRechazo.trim())
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pago Revisión':
        return 'bg-blue-100 text-blue-800'
      case 'Pago Rechazado':
        return 'bg-red-100 text-red-800'
      case 'Enviado':
        return 'bg-purple-100 text-purple-800'
      case 'Entregado':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  // Funciones para gestión de productos
  const cargarProductos = async () => {
    try {
      setLoadingProductos(true)
      setErrorProductos('')
      const response = await fetch('/api/productos')
      
      if (!response.ok) {
        throw new Error('Error al cargar los productos')
      }
      
      const data = await response.json()
      setProductos(data)
    } catch (err) {
      console.error('Error al cargar productos:', err)
      setErrorProductos('Error al cargar los productos. Por favor, recarga la página.')
    } finally {
      setLoadingProductos(false)
    }
  }

  const handleAbrirFormulario = async (producto = null) => {
    // Cargar categorías si no están cargadas
    if (categorias.length === 0) {
      await cargarCategorias()
    }
    
    if (producto) {
      setProductoEditando(producto)
      setFormData({
        nombre: producto.nombre || '',
        precio: producto.precio?.toString() || '',
        stock: producto.stock?.toString() || '',
        imagen_url: producto.imagen_url || '',
        categoria_id: producto.categoria_id?.toString() || ''
      })
    } else {
      setProductoEditando(null)
      setFormData({
        nombre: '',
        precio: '',
        stock: '',
        imagen_url: '',
        categoria_id: ''
      })
    }
    setErrorFormulario('')
    setMostrarFormulario(true)
  }

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false)
    setProductoEditando(null)
    setFormData({
      nombre: '',
      precio: '',
      stock: '',
      imagen_url: ''
    })
    setErrorFormulario('')
  }

  const handleSubmitProducto = async (e) => {
    e.preventDefault()
    setErrorFormulario('')

    // Validar formulario
    if (!formData.nombre || !formData.nombre.trim()) {
      setErrorFormulario('El nombre del producto es obligatorio.')
      return
    }

    if (!formData.precio || isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) < 0) {
      setErrorFormulario('El precio debe ser un número mayor o igual a 0.')
      return
    }

    if (!formData.stock || isNaN(parseInt(formData.stock)) || parseInt(formData.stock) < 0) {
      setErrorFormulario('El stock debe ser un número entero mayor o igual a 0.')
      return
    }

    try {
      const url = productoEditando 
        ? `/api/productos/${productoEditando.id}` 
        : '/api/productos'
      const method = productoEditando ? 'PUT' : 'POST'

      const body = {
        nombre: formData.nombre.trim(),
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        imagen_url: formData.imagen_url.trim() || null,
        categoria_id: formData.categoria_id ? parseInt(formData.categoria_id) : null
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar el producto')
      }

      // Recargar la lista de productos
      await cargarProductos()
      
      // Cerrar el formulario
      handleCerrarFormulario()
    } catch (err) {
      console.error('Error al guardar producto:', err)
      setErrorFormulario(err.message || 'Error al guardar el producto')
    }
  }

  const handleEliminarProducto = async (productoId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return
    }

    try {
      const response = await fetch(`/api/productos/${productoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar el producto')
      }

      // Recargar la lista de productos
      await cargarProductos()
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      alert('Error al eliminar el producto: ' + err.message)
    }
  }

  // Funciones para gestión de tasa BCV
  const cargarTasaBcv = async () => {
    try {
      const response = await fetch('/api/configuracion/tasa')
      
      if (!response.ok) {
        throw new Error('Error al cargar la tasa BCV')
      }
      
      const data = await response.json()
      setTasaBcv(data.tasa_bcv)
      setTasaBcvInput(data.tasa_bcv.toString())
      setErrorTasa('')
    } catch (err) {
      console.error('Error al cargar tasa BCV:', err)
      setErrorTasa('Error al cargar la tasa BCV')
    }
  }

  const handleActualizarTasaBcv = async (e) => {
    e.preventDefault()
    setErrorTasa('')

    // Validar que sea un número válido
    const tasa = parseFloat(tasaBcvInput)
    if (isNaN(tasa) || tasa <= 0) {
      setErrorTasa('La tasa BCV debe ser un número mayor que 0')
      return
    }

    try {
      setActualizandoTasa(true)
      const response = await fetch('/api/configuracion/tasa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ tasa_bcv: tasa })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la tasa BCV')
      }

      const data = await response.json()
      setTasaBcv(data.tasa_bcv)
      setTasaBcvInput(data.tasa_bcv.toString())
      alert('Tasa BCV actualizada correctamente')
    } catch (err) {
      console.error('Error al actualizar tasa BCV:', err)
      setErrorTasa(err.message || 'Error al actualizar la tasa BCV')
    } finally {
      setActualizandoTasa(false)
    }
  }

  // Funciones para gestión de categorías
  const cargarCategorias = async () => {
    try {
      setLoadingCategorias(true)
      setErrorCategorias('')
      const response = await fetch('/api/categorias')
      
      if (!response.ok) {
        throw new Error('Error al cargar las categorías')
      }
      
      const data = await response.json()
      setCategorias(data)
    } catch (err) {
      console.error('Error al cargar categorías:', err)
      setErrorCategorias('Error al cargar las categorías. Por favor, recarga la página.')
    } finally {
      setLoadingCategorias(false)
    }
  }

  const handleAbrirFormularioCategoria = (categoria = null) => {
    if (categoria) {
      setCategoriaEditando(categoria)
      setNombreCategoria(categoria.nombre || '')
    } else {
      setCategoriaEditando(null)
      setNombreCategoria('')
    }
    setErrorCategoriaForm('')
    setMostrarFormularioCategoria(true)
  }

  const handleCerrarFormularioCategoria = () => {
    setMostrarFormularioCategoria(false)
    setCategoriaEditando(null)
    setNombreCategoria('')
    setErrorCategoriaForm('')
  }

  const handleSubmitCategoria = async (e) => {
    e.preventDefault()
    setErrorCategoriaForm('')

    if (!nombreCategoria || !nombreCategoria.trim()) {
      setErrorCategoriaForm('El nombre de la categoría es obligatorio.')
      return
    }

    try {
      const url = categoriaEditando 
        ? `/api/categorias/${categoriaEditando.id}` 
        : '/api/categorias'
      const method = categoriaEditando ? 'PUT' : 'POST'

      const body = {
        nombre: nombreCategoria.trim()
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la categoría')
      }

      // Recargar la lista de categorías
      await cargarCategorias()
      
      // Cerrar el formulario
      handleCerrarFormularioCategoria()
    } catch (err) {
      console.error('Error al guardar categoría:', err)
      setErrorCategoriaForm(err.message || 'Error al guardar la categoría')
    }
  }

  const handleEliminarCategoria = async (categoriaId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Los productos asociados se moverán a "Sin Categoría".')) {
      return
    }

    try {
      const response = await fetch(`/api/categorias/${categoriaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la categoría')
      }

      // Recargar la lista de categorías y productos
      await cargarCategorias()
      if (activeTab === 'productos') {
        await cargarProductos()
      }
    } catch (err) {
      console.error('Error al eliminar categoría:', err)
      alert('Error al eliminar la categoría: ' + err.message)
    }
  }

  if (loading && activeTab === 'pedidos') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          {activeTab === 'pedidos' && (
          <button
            onClick={cargarPedidos}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Actualizar
          </button>
          )}
        </div>

        {/* Configuración de Tasa BCV */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Configuración</h3>
          <form onSubmit={handleActualizarTasaBcv} className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="tasaBcv" className="block text-sm font-medium text-gray-700 mb-2">
                Tasa BCV del Día
              </label>
              <input
                type="number"
                id="tasaBcv"
                step="0.01"
                min="0.01"
                value={tasaBcvInput}
                onChange={(e) => {
                  setTasaBcvInput(e.target.value)
                  setErrorTasa('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="36.00"
                required
              />
              {errorTasa && (
                <p className="mt-1 text-sm text-red-600">{errorTasa}</p>
              )}
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-3">
                Valor actual: <strong>{tasaBcv.toFixed(2)}</strong>
              </span>
            </div>
            <button
              type="submit"
              disabled={actualizandoTasa}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {actualizandoTasa ? 'Actualizando...' : 'Actualizar Tasa'}
            </button>
          </form>
        </div>

        {/* Pestañas */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pedidos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestión de Pedidos
            </button>
            <button
              onClick={() => setActiveTab('productos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'productos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestión de Productos
            </button>
            <button
              onClick={() => setActiveTab('categorias')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categorias'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gestión de Categorías
            </button>
          </nav>
        </div>

        {/* Contenido de Pedidos */}
        {activeTab === 'pedidos' && (
          <>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">No hay pedidos registrados</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección de Entrega
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{pedido.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pedido.nombre_usuario || 'Sin nombre'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-xs">
                          {pedido.productos && pedido.productos.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {pedido.productos.map((producto, index) => (
                                <li key={index} className="text-xs">
                                  {producto.nombre} x{producto.cantidad}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400">Sin productos</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <div className="flex flex-col">
                          <span>${pedido.total.toFixed(2)}</span>
                          <span className="text-xs text-gray-500">
                            Bs. {(pedido.total * tasaBcv).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="max-w-xs">
                          {pedido.direccion_pedido ? (
                            <p className="text-xs break-words">{pedido.direccion_pedido}</p>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin dirección</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(pedido.estado)}`}>
                          {pedido.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pedido.referencia_pago || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatearFecha(pedido.fecha_creacion)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {pedido.estado === 'Pago Revisión' && (
                            <>
                              <button
                                onClick={() => actualizarEstado(pedido.id, 'Enviado')}
                                disabled={actualizando[pedido.id]}
                                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                {actualizando[pedido.id] ? 'Actualizando...' : 'Marcar como Enviado'}
                              </button>
                              <button
                                onClick={() => handleRechazarPago(pedido)}
                                disabled={actualizando[pedido.id]}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                Rechazar Pago
                              </button>
                            </>
                          )}
                          {pedido.estado === 'Enviado' && (
                            <button
                              onClick={() => actualizarEstado(pedido.id, 'Entregado')}
                              disabled={actualizando[pedido.id]}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                            >
                              {actualizando[pedido.id] ? 'Actualizando...' : 'Marcar como Entregado'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Rechazo de Pago */}
        {pedidoRechazar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Rechazar Pago</h2>
                  <button
                    onClick={handleCerrarModalRechazo}
                    className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Pedido:</span> #{pedidoRechazar.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Total:</span> ${pedidoRechazar.total.toFixed(2)}
                    <span className="ml-2 text-xs text-gray-500">
                      (Bs. {(pedidoRechazar.total * tasaBcv).toFixed(2)})
                    </span>
                  </p>
                </div>

                <div className="mb-6">
                  <label htmlFor="motivoRechazo" className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del Rechazo <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="motivoRechazo"
                    value={motivoRechazo}
                    onChange={(e) => {
                      setMotivoRechazo(e.target.value)
                      setErrorMotivo('')
                    }}
                    rows={4}
                    placeholder="Ingrese el motivo del rechazo del pago..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  />
                  {errorMotivo && (
                    <p className="mt-2 text-sm text-red-600">{errorMotivo}</p>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCerrarModalRechazo}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmarRechazo}
                    disabled={actualizando[pedidoRechazar.id] || !motivoRechazo.trim()}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    {actualizando[pedidoRechazar.id] ? 'Confirmando...' : 'Confirmar Rechazo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Contenido de Productos */}
        {activeTab === 'productos' && (
          <>
            {errorProductos && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorProductos}
              </div>
            )}

            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
              <button
                onClick={() => handleAbrirFormulario()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                + Añadir Producto
              </button>
            </div>

            {loadingProductos ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">Cargando productos...</p>
              </div>
            ) : productos.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">No hay productos registrados</p>
                <button
                  onClick={() => handleAbrirFormulario()}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Añadir Primer Producto
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Imagen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productos.map((producto) => (
                        <tr key={producto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{producto.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {producto.imagen_url ? (
                              <img
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className="h-16 w-16 object-cover rounded"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/64?text=Sin+Imagen'
                                }}
                              />
                            ) : (
                              <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                Sin imagen
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {producto.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {producto.categoria_nombre || 'Sin Categoría'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            ${producto.precio.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              producto.stock === 0 
                                ? 'bg-red-100 text-red-800' 
                                : producto.stock < 10 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {producto.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAbrirFormulario(producto)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarProducto(producto.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal de Formulario de Producto */}
            {mostrarFormulario && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {productoEditando ? 'Editar Producto' : 'Añadir Producto'}
                      </h2>
                      <button
                        onClick={handleCerrarFormulario}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                      >
                        ×
                      </button>
                    </div>

                    {errorFormulario && (
                      <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errorFormulario}
                      </div>
                    )}

                    <form onSubmit={handleSubmitProducto}>
                      <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="nombre"
                          value={formData.nombre}
                          onChange={(e) => {
                            setFormData({ ...formData, nombre: e.target.value })
                            setErrorFormulario('')
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Nombre del producto"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                          Precio ($) <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          id="precio"
                          step="0.01"
                          min="0"
                          value={formData.precio}
                          onChange={(e) => {
                            setFormData({ ...formData, precio: e.target.value })
                            setErrorFormulario('')
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                          Stock <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          id="stock"
                          min="0"
                          step="1"
                          value={formData.stock}
                          onChange={(e) => {
                            setFormData({ ...formData, stock: e.target.value })
                            setErrorFormulario('')
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="0"
                        />
                      </div>

                      <div className="mb-4">
                        <label htmlFor="imagen_url" className="block text-sm font-medium text-gray-700 mb-2">
                          URL de la Imagen
                        </label>
                        <input
                          type="url"
                          id="imagen_url"
                          value={formData.imagen_url}
                          onChange={(e) => {
                            setFormData({ ...formData, imagen_url: e.target.value })
                            setErrorFormulario('')
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          URL completa de la imagen del producto (opcional)
                        </p>
                      </div>

                      <div className="mb-6">
                        <label htmlFor="categoria_id" className="block text-sm font-medium text-gray-700 mb-2">
                          Categoría
                        </label>
                        <select
                          id="categoria_id"
                          value={formData.categoria_id}
                          onChange={(e) => {
                            setFormData({ ...formData, categoria_id: e.target.value })
                            setErrorFormulario('')
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">Sin Categoría</option>
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id.toString()}>
                              {categoria.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleCerrarFormulario}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          {productoEditando ? 'Actualizar' : 'Crear'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Contenido de Categorías */}
        {activeTab === 'categorias' && (
          <>
            {errorCategorias && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {errorCategorias}
              </div>
            )}

            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Categorías</h2>
              <button
                onClick={() => handleAbrirFormularioCategoria()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                + Añadir Categoría
              </button>
            </div>

            {loadingCategorias ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">Cargando categorías...</p>
              </div>
            ) : categorias.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600 text-lg">No hay categorías registradas</p>
                <button
                  onClick={() => handleAbrirFormularioCategoria()}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Añadir Primera Categoría
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categorias.map((categoria) => (
                        <tr key={categoria.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{categoria.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {categoria.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleAbrirFormularioCategoria(categoria)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminarCategoria(categoria.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1 px-3 rounded transition-colors"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal de Formulario de Categoría */}
            {mostrarFormularioCategoria && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {categoriaEditando ? 'Editar Categoría' : 'Añadir Categoría'}
                      </h2>
                      <button
                        onClick={handleCerrarFormularioCategoria}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                      >
                        ×
                      </button>
                    </div>

                    {errorCategoriaForm && (
                      <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {errorCategoriaForm}
                      </div>
                    )}

                    <form onSubmit={handleSubmitCategoria}>
                      <div className="mb-6">
                        <label htmlFor="nombreCategoria" className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          id="nombreCategoria"
                          value={nombreCategoria}
                          onChange={(e) => {
                            setNombreCategoria(e.target.value)
                            setErrorCategoriaForm('')
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="Nombre de la categoría"
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleCerrarFormularioCategoria}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          {categoriaEditando ? 'Actualizar' : 'Crear'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminPanel

