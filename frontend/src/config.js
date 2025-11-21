// Configuración de la API
// En desarrollo, usa el proxy de Vite (ruta relativa)
// En producción, usa la variable de entorno VITE_API_URL
export const API_URL = import.meta.env.VITE_API_URL || ''

// Función helper para construir URLs de API
export const getApiUrl = (endpoint) => {
  // Si endpoint ya empieza con http, devolverlo tal cual
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  
  // Si endpoint empieza con /, eliminar el / inicial
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  
  // Si tenemos API_URL configurada, usarla; si no, usar ruta relativa (para desarrollo con proxy)
  return API_URL ? `${API_URL}/${cleanEndpoint}` : `/${cleanEndpoint}`
}


