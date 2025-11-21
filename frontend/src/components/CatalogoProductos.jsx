import { useState, useEffect } from 'react'

function CatalogoProductos({ productos, onAgregarAlCarrito }) {
  const [busqueda, setBusqueda] = useState('')
  const [tasaBcv, setTasaBcv] = useState(36.00)
  const [categorias, setCategorias] = useState([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')

  // Cargar tasa BCV y categorías al montar el componente
  useEffect(() => {
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
    
    const cargarCategorias = async () => {
      try {
        const response = await fetch('/api/categorias')
        if (response.ok) {
          const data = await response.json()
          setCategorias(data)
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err)
      }
    }
    
    cargarTasaBcv()
    cargarCategorias()
  }, [])

  // Filtrar productos según búsqueda y categoría
  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria = !categoriaSeleccionada || 
      producto.categoria_id?.toString() === categoriaSeleccionada ||
      (!producto.categoria_id && categoriaSeleccionada === 'sin-categoria')
    return coincideBusqueda && coincideCategoria
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Catálogo de Productos</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white min-w-[200px]"
          >
            <option value="">Todas las categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id.toString()}>
                {categoria.nombre}
              </option>
            ))}
            <option value="sin-categoria">Sin Categoría</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {productosFiltrados.map(producto => (
          <div
            key={producto.id}
            className="producto-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            style={{ backgroundColor: 'white' }}
          >
            <div 
              style={{ 
                height: '160px',
                maxHeight: '160px',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: '#e5e7eb',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={producto.imagen_url || 'https://via.placeholder.com/400x300'}
                alt={producto.nombre}
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  margin: 0,
                  padding: 0,
                  border: 'none'
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x300?text=Sin+Imagen'
                }}
              />
            </div>
            <div className="p-3 flex flex-col flex-grow">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">
                {producto.nombre}
              </h3>
              <div className="flex flex-col mb-2">
                <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-green-600">
                      ${producto.precio.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-600">
                      Bs. {(producto.precio * tasaBcv).toFixed(2)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-semibold ${
                    producto.stock > 10
                      ? 'bg-green-100 text-green-800'
                      : producto.stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.stock === 0 ? 'AGOTADO' : producto.stock}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onAgregarAlCarrito(producto)}
                disabled={producto.stock === 0}
                className={`w-full py-1.5 px-3 rounded-lg text-sm font-semibold transition-colors mt-auto ${
                  producto.stock > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {producto.stock > 0 ? 'Añadir al Carrito' : 'AGOTADO'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No se encontraron productos.</p>
        </div>
      )}
    </div>
  )
}

export default CatalogoProductos


