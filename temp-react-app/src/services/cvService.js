import api from './api';

// Error type constants
const ERROR_TYPES = {
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  NETWORK: 'NETWORK_ERROR'
};

// Helper function to create typed errors
const createError = (type, message, meta = {}) => ({
  __isCustomError: true,
  type,
  message,
  ...meta
});

/**
 * Valida los datos del CV antes de enviarlos al servidor
 * @param {Object} cvData - Datos del CV a validar
 * @returns {Array} Lista de errores de validación
 */
const validateCVData = (cvData) => {
  const errors = [];
  
  if (!cvData.nombreCompleto?.trim()) {
    errors.push({ field: 'nombreCompleto', message: 'El nombre completo es obligatorio' });
  }
  
  if (!cvData.email?.trim()) {
    errors.push({ field: 'email', message: 'El correo electrónico es obligatorio' });
  } else if (!/\S+@\S+\.\S+/.test(cvData.email)) {
    errors.push({ field: 'email', message: 'El correo electrónico no es válido' });
  }
  
  if (cvData.telefono && !/^[\d\s+\-()]+$/.test(cvData.telefono)) {
    errors.push({ field: 'telefono', message: 'El formato del teléfono no es válido' });
  }
  
  // Validar que al menos haya una experiencia laboral
  if (!cvData.experiencia?.length) {
    errors.push({ field: 'experiencia', message: 'Debes agregar al menos una experiencia laboral' });
  } else {
    // Validar cada experiencia
    cvData.experiencia.forEach((exp, index) => {
      if (!exp.puesto?.trim()) {
        errors.push({ field: `experiencia_${index}_puesto`, message: 'El puesto es obligatorio' });
      }
      if (!exp.empresa?.trim()) {
        errors.push({ field: `experiencia_${index}_empresa`, message: 'La empresa es obligatoria' });
      }
    });
  }
  
  // Validar que al menos haya una educación
  if (!cvData.educacion?.length) {
    errors.push({ field: 'educacion', message: 'Debes agregar al menos un nivel educativo' });
  } else {
    // Validar cada educación
    cvData.educacion.forEach((edu, index) => {
      if (!edu.titulo?.trim()) {
        errors.push({ field: `educacion_${index}_titulo`, message: 'El título es obligatorio' });
      }
      if (!edu.institucion?.trim()) {
        errors.push({ field: `educacion_${index}_institucion`, message: 'La institución es obligatoria' });
      }
    });
  }
  
  // Validar que al menos haya una habilidad
  if (!cvData.habilidades?.length || !cvData.habilidades.some(h => h.trim())) {
    errors.push({ field: 'habilidades', message: 'Debes agregar al menos una habilidad' });
  }
  
  return errors;
};

/**
 * Servicio para manejar las operaciones relacionadas con CVs
 */
const cvService = {
  /**
   * Genera un CV con los datos proporcionados
   * @param {Object} cvData - Datos del CV a generar
   * @param {string} template - Plantilla a utilizar
   * @returns {Promise<Object>} - Respuesta del servidor con la URL del CV generado
   * @throws {ValidationError|ServerError} - Errores de validación o del servidor
   */
  async generateCV(cvData, template = 'modern') {
    try {
      // Validar datos antes de enviar al servidor
      const validationErrors = validateCVData(cvData);
      if (validationErrors.length > 0) {
        throw createError(ERROR_TYPES.VALIDATION, 'Error de validación', { errors: validationErrors });
      }
      
      const response = await api.post('/generate-cv', {
        ...cvData,
        template,
      });
      
      if (!response.data?.fileUrl) {
        throw createError(ERROR_TYPES.SERVER, 'La respuesta del servidor no contiene la URL del CV', { status: 500 });
      }
      
      return response.data;
    } catch (error) {
      // Si ya es un error personalizado, relanzarlo
      if (error.__isCustomError) {
        throw error;
      }
      
      // Manejar errores de red o del servidor
      const status = error.response?.status;
      let message = 'Error al generar el CV';
      
      if (status === 400) {
        message = 'Datos del formulario inválidos';
      } else if (status === 500) {
        message = 'Error en el servidor al generar el CV';
      } else if (!navigator.onLine) {
        message = 'No hay conexión a internet';
        throw createError(ERROR_TYPES.NETWORK, message);
      } else {
        message = error.message || message;
      }
      
      throw createError(ERROR_TYPES.SERVER, message, { status: status || 500 });
    }
  },

  /**
   * Obtiene las plantillas disponibles
   * @returns {Promise<Array>} - Lista de plantillas disponibles
   * @throws {ServerError} - Si hay un error al obtener las plantillas
   */
  async getTemplates() {
    try {
      const response = await api.get('/templates');
      
      if (!Array.isArray(response.data)) {
        throw createError(ERROR_TYPES.SERVER, 'Formato de respuesta inválido', { status: 500 });
      }
      
      return response.data;
    } catch (error) {
      // Si ya es un error personalizado, relanzarlo
      if (error.__isCustomError) {
        throw error;
      }
      
      const status = error.response?.status;
      let message = 'Error al obtener las plantillas';
      
      if (status === 404) {
        message = 'No se encontraron plantillas disponibles';
      } else if (!navigator.onLine) {
        message = 'No hay conexión a internet';
        throw createError(ERROR_TYPES.NETWORK, message);
      } else {
        message = error.message || message;
      }
      
      throw createError(ERROR_TYPES.SERVER, message, { status: status || 500 });
    }
  },

  /**
   * Descarga un CV generado
   * @param {string} fileUrl - URL del archivo a descargar
   * @param {string} fileName - Nombre del archivo para la descarga
   * @throws {Error} - Si no se puede iniciar la descarga
   */
  downloadCV(fileUrl, fileName = 'mi-cv.pdf') {
    try {
      if (!fileUrl) {
        throw new Error('No se proporcionó una URL válida para descargar el CV');
      }
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Forzar descarga en una nueva pestaña para manejar mejor los PDFs
      const newWindow = window.open(fileUrl, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Si el navegador bloquea la apertura en nueva pestaña, intentar descarga directa
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error al descargar el CV:', error);
      throw new Error('No se pudo iniciar la descarga del CV. Por favor, inténtalo de nuevo.');
    }
  },
  
  /**
   * Valida si una URL es segura para descargar
   * @param {string} url - URL a validar
   * @returns {boolean} - true si la URL es segura
   */
  isSafeUrl(url) {
    if (!url) return false;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }
};

export default cvService;
