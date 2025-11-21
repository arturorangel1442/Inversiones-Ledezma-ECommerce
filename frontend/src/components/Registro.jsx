import { useState } from 'react'

function Registro({ onRegisterSuccess, onSwitchToLogin }) {
  const [correo, setCorreo] = useState('')
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [confirmarContraseña, setConfirmarContraseña] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validar que las contraseñas coincidan
    if (contraseña !== confirmarContraseña) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Validar longitud mínima
    if (contraseña.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          correo: correo,
          nombre_usuario: nombreUsuario,
          contraseña: contraseña
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario')
      }

      // Si el registro es exitoso, llamar al callback
      if (onRegisterSuccess) {
        onRegisterSuccess(data)
      }
    } catch (err) {
      console.error('Error al registrar:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Crear Cuenta</h2>
          <p className="text-gray-600">Regístrate para comenzar a comprar</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nombreUsuario" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="nombreUsuario"
              value={nombreUsuario}
              onChange={(e) => {
                setNombreUsuario(e.target.value)
                setError('')
              }}
              placeholder="Tu nombre"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={(e) => {
                setCorreo(e.target.value)
                setError('')
              }}
              required
              placeholder="tu@correo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="contraseña" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="contraseña"
              value={contraseña}
              onChange={(e) => {
                setContraseña(e.target.value)
                setError('')
              }}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmarContraseña" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmarContraseña"
              value={confirmarContraseña}
              onChange={(e) => {
                setConfirmarContraseña(e.target.value)
                setError('')
              }}
              required
              minLength={6}
              placeholder="Repite tu contraseña"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-green-600 hover:text-green-700 font-semibold underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Registro


