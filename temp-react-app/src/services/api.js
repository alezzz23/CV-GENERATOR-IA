import axios from 'axios';

// Crear una instancia de axios con configuración base
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // URL base del backend
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Importante para enviar cookies si es necesario
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores globales aquí
    if (error.response) {
      // El servidor respondió con un estado de error
      console.error('Error de respuesta del servidor:', error.response.data);
      return Promise.reject({
        message: error.response.data.message || 'Error en la solicitud',
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor:', error.request);
      
      // Verificar si es un error de CORS
      if (error.message && error.message.includes('Network Error')) {
        return Promise.reject({
          message: 'Error de conexión. Verifica que el servidor esté en ejecución y que no haya problemas de CORS.',
          isCorsError: true,
          isNetworkError: true,
        });
      }
      
      // Error de timeout
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message: 'La solicitud tardó demasiado tiempo. Por favor, verifica tu conexión a internet.',
          isTimeout: true,
          isNetworkError: true,
        });
      }
      
      // Otros errores de red
      return Promise.reject({
        message: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.',
        isNetworkError: true,
      });
    } else {
      // Algo pasó en la configuración de la solicitud
      console.error('Error al configurar la solicitud:', error.message);
      return Promise.reject({
        message: 'Error al procesar la solicitud',
        error: error.message,
      });
    }
  }
);

export default api;
