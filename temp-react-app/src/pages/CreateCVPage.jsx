import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import cvService from '../services/cvService';

const CreateCVPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [formErrors, setFormErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const formRef = useRef(null);
  
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    titulo: '',
    email: '',
    telefono: '',
    direccion: '',
    resumen: '',
    experiencia: [
      { puesto: '', empresa: '', fechaInicio: '', fechaFin: '', descripcion: '' }
    ],
    educacion: [
      { titulo: '', institucion: '', fechaInicio: '', fechaFin: '', descripcion: '' }
    ],
    habilidades: ['']
  });
  
  // Efecto para hacer scroll al primer campo con error
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      const firstErrorField = document.querySelector('[data-error="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        firstErrorField.focus({ preventScroll: true });
      }
    }
  }, [formErrors]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar el error cuando el usuario comienza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Función para manejar el cambio en los campos de arrays (experiencia, educación, etc.)
  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
    
    // Limpiar errores de validación para este campo
    const fieldKey = `${arrayName}_${index}_${field}`;
    if (formErrors[fieldKey]) {
      setFormErrors(prev => ({
        ...prev,
        [fieldKey]: null
      }));
    }
  };
  
  // Función para agregar un nuevo elemento a un array
  const addNewItem = (arrayName, newItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], newItem]
    }));
  };
  
  // Función para eliminar un elemento de un array
  const removeItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };
  
  // Función para manejar el cambio en las habilidades
  const handleSkillChange = (index, value) => {
    const newHabilidades = [...formData.habilidades];
    newHabilidades[index] = value;
    setFormData(prev => ({
      ...prev,
      habilidades: newHabilidades
    }));
    
    // Limpiar error de habilidades si existe
    if (formErrors.habilidades) {
      setFormErrors(prev => ({
        ...prev,
        habilidades: null
      }));
    }
  };
  
  // Función para agregar una nueva habilidad
  const addNewSkill = () => {
    setFormData(prev => ({
      ...prev,
      habilidades: [...prev.habilidades, '']
    }));
  };
  
  // Función para eliminar una habilidad
  const removeSkill = (index) => {
    if (formData.habilidades.length > 1) {
      const newHabilidades = formData.habilidades.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        habilidades: newHabilidades
      }));
    }
  };
  
  // Función para manejar el envío del formulario
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Reiniciar errores
    setFormErrors({});
    
    // Marcar todos los campos como tocados para mostrar errores
    const touchedFields = {};
    Object.keys(formData).forEach(key => {
      touchedFields[key] = true;
    });
    setFieldTouched(touchedFields);
    
    setIsSubmitting(true);
    
    try {
      // Mostrar notificación de carga
      const toastId = toast.loading('Generando tu CV, por favor espera...');
      
      // Llamar al servicio para generar el CV
      const response = await cvService.generateCV(formData, selectedTemplate);
      
      // Si la generación fue exitosa, descargar el CV
      if (response.fileUrl) {
        toast.update(toastId, {
          render: '¡CV generado con éxito! Descargando...',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
        
        // Pequeño retraso para que el usuario vea el mensaje de éxito
        setTimeout(() => {
          try {
            cvService.downloadCV(response.fileUrl, `CV-${formData.nombreCompleto || 'sin-nombre'}.pdf`);
          } catch (downloadError) {
            console.error('Error al descargar el CV:', downloadError);
            toast.error('Error al iniciar la descarga. Por favor, inténtalo de nuevo.');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error al generar el CV:', error);
      
      // Manejar errores de CORS específicamente
      if (error.isCorsError) {
        toast.error(
          <div>
            <p>Error de conexión con el servidor:</p>
            <p className="font-medium">{error.message}</p>
            <p className="text-sm mt-1">Asegúrate de que el servidor esté en ejecución y que no haya problemas de CORS.</p>
          </div>,
          { autoClose: 10000 }
        );
        return;
      }
      
      // Manejar timeouts
      if (error.isTimeout) {
        toast.error(
          <div>
            <p>La solicitud tardó demasiado tiempo</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>,
          { autoClose: 8000 }
        );
        return;
      }
      
      // Manejar errores de red
      if (error.isNetworkError) {
        toast.error(
          <div>
            <p>Error de conexión</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>,
          { autoClose: 8000 }
        );
        return;
      }
      
      // Manejar errores de validación del servidor
      if (error.__isCustomError) {
        if (error.type === 'VALIDATION_ERROR' && error.errors) {
          // Procesar errores de validación
          const newErrors = {};
          error.errors.forEach(err => {
            newErrors[err.field] = err.message;
          });
          
          setFormErrors(newErrors);
          
          // Hacer scroll al primer campo con error
          setTimeout(() => {
            const firstErrorField = document.querySelector('[data-error="true"]');
            if (firstErrorField) {
              firstErrorField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              firstErrorField.focus({ preventScroll: true });
            }
          }, 100);
          
          toast.error('Por favor, corrige los errores en el formulario');
          return;
        }
        
        // Mostrar otros errores personalizados
        toast.error(error.message || 'Ocurrió un error al procesar tu solicitud');
        return;
      }
      
      // Error genérico
      toast.error('Ocurrió un error al generar el CV. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedTemplate]);
  
  // Función para verificar si un campo tiene error
  const hasError = (fieldName) => {
    return formErrors[fieldName] && (fieldTouched[fieldName] || Object.keys(fieldTouched).length > 0);
  };
  
  // Función para obtener la clase de error de un campo
  const getInputClass = (fieldName) => {
    return `mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
      hasError(fieldName) 
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;
  };

  const handleTemplateChange = (template) => {
    setSelectedTemplate(template);
    toast.info(`Plantilla ${template} seleccionada`, { autoClose: 2000 });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" ref={formRef}>
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo CV</h1>
              <p className="mt-1 text-sm text-gray-600">
                Completa el formulario para generar tu CV profesional.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('modern')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedTemplate === 'modern' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Moderno
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('classic')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedTemplate === 'classic' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Clásico
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Personal */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="border-b border-gray-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Información Personal
                </h3>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    id="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, nombreCompleto: true }))}
                    className={getInputClass('nombreCompleto')}
                    data-error={!!formErrors.nombreCompleto}
                    aria-invalid={!!formErrors.nombreCompleto}
                    aria-describedby={formErrors.nombreCompleto ? 'nombreCompleto-error' : undefined}
                  />
                  {hasError('nombreCompleto') && (
                    <p className="mt-2 text-sm text-red-600" id="nombreCompleto-error">
                      {formErrors.nombreCompleto}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                    Título Profesional
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    id="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, titulo: true }))}
                    className={getInputClass('titulo')}
                    data-error={!!formErrors.titulo}
                    aria-invalid={!!formErrors.titulo}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, email: true }))}
                    className={getInputClass('email')}
                    data-error={!!formErrors.email}
                    aria-invalid={!!formErrors.email}
                    aria-describedby={formErrors.email ? 'email-error' : undefined}
                  />
                  {hasError('email') && (
                    <p className="mt-2 text-sm text-red-600" id="email-error">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    id="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, telefono: true }))}
                    className={getInputClass('telefono')}
                    data-error={!!formErrors.telefono}
                    aria-invalid={!!formErrors.telefono}
                    aria-describedby={formErrors.telefono ? 'telefono-error' : undefined}
                  />
                  {hasError('telefono') && (
                    <p className="mt-2 text-sm text-red-600" id="telefono-error">
                      {formErrors.telefono}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    id="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, direccion: true }))}
                    className={getInputClass('direccion')}
                  />
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="resumen" className="block text-sm font-medium text-gray-700">
                    Resumen Profesional
                  </label>
                  <textarea
                    id="resumen"
                    name="resumen"
                    rows={3}
                    value={formData.resumen}
                    onChange={handleInputChange}
                    onBlur={() => setFieldTouched(prev => ({ ...prev, resumen: true }))}
                    className={getInputClass('resumen')}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Breve descripción de tu experiencia y habilidades principales.
                  </p>
                </div>
              </div>
            </div>

            {/* Experiencia Laboral */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Experiencia Laboral
                </h3>
                <button
                  type="button"
                  onClick={() => addNewItem('experiencia', { puesto: '', empresa: '', fechaInicio: '', fechaFin: '', descripcion: '' })}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Agregar Experiencia
                </button>
              </div>

              {formData.experiencia.map((exp, index) => (
                <div key={index} className="mt-6 border border-gray-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeItem('experiencia', index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`puesto-${index}`} className="block text-sm font-medium text-gray-700">
                        Puesto
                      </label>
                      <input
                        type="text"
                        id={`puesto-${index}`}
                        value={exp.puesto}
                        onChange={(e) => handleArrayChange('experiencia', index, 'puesto', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`empresa-${index}`} className="block text-sm font-medium text-gray-700">
                        Empresa
                      </label>
                      <input
                        type="text"
                        id={`empresa-${index}`}
                        value={exp.empresa}
                        onChange={(e) => handleArrayChange('experiencia', index, 'empresa', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`fechaInicio-${index}`} className="block text-sm font-medium text-gray-700">
                        Fecha de Inicio
                      </label>
                      <input
                        type="month"
                        id={`fechaInicio-${index}`}
                        value={exp.fechaInicio}
                        onChange={(e) => handleArrayChange('experiencia', index, 'fechaInicio', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`fechaFin-${index}`} className="block text-sm font-medium text-gray-700">
                        Fecha de Fin
                      </label>
                      <input
                        type="month"
                        id={`fechaFin-${index}`}
                        value={exp.fechaFin}
                        onChange={(e) => handleArrayChange('experiencia', index, 'fechaFin', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor={`descripcion-${index}`} className="block text-sm font-medium text-gray-700">
                        Descripción
                      </label>
                      <textarea
                        id={`descripcion-${index}`}
                        rows={3}
                        value={exp.descripcion}
                        onChange={(e) => handleArrayChange('experiencia', index, 'descripcion', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Educación */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="flex justify-between items-center border-b border-gray-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Educación
                </h3>
                <button
                  type="button"
                  onClick={() => addNewItem('educacion', { titulo: '', institucion: '', fechaInicio: '', fechaFin: '', descripcion: '' })}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Agregar Educación
                </button>
              </div>

              {formData.educacion.map((edu, index) => (
                <div key={index} className="mt-6 border border-gray-200 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeItem('educacion', index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor={`titulo-edu-${index}`} className="block text-sm font-medium text-gray-700">
                        Título o Grado
                      </label>
                      <input
                        type="text"
                        id={`titulo-edu-${index}`}
                        value={edu.titulo}
                        onChange={(e) => handleArrayChange('educacion', index, 'titulo', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`institucion-${index}`} className="block text-sm font-medium text-gray-700">
                        Institución
                      </label>
                      <input
                        type="text"
                        id={`institucion-${index}`}
                        value={edu.institucion}
                        onChange={(e) => handleArrayChange('educacion', index, 'institucion', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`fechaInicio-edu-${index}`} className="block text-sm font-medium text-gray-700">
                        Fecha de Inicio
                      </label>
                      <input
                        type="month"
                        id={`fechaInicio-edu-${index}`}
                        value={edu.fechaInicio}
                        onChange={(e) => handleArrayChange('educacion', index, 'fechaInicio', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label htmlFor={`fechaFin-edu-${index}`} className="block text-sm font-medium text-gray-700">
                        Fecha de Fin
                      </label>
                      <input
                        type="month"
                        id={`fechaFin-edu-${index}`}
                        value={edu.fechaFin}
                        onChange={(e) => handleArrayChange('educacion', index, 'fechaFin', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor={`descripcion-edu-${index}`} className="block text-sm font-medium text-gray-700">
                        Descripción (opcional)
                      </label>
                      <textarea
                        id={`descripcion-edu-${index}`}
                        rows={2}
                        value={edu.descripcion}
                        onChange={(e) => handleArrayChange('educacion', index, 'descripcion', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Habilidades */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <div className="border-b border-gray-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Habilidades
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Agrega tus habilidades principales.
                </p>
              </div>
              <div className="mt-6">
                {formData.habilidades.map((habilidad, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      value={habilidad}
                      onChange={(e) => handleSkillChange(index, e.target.value)}
                      className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Ej: JavaScript, Diseño UI/UX, etc."
                    />
                    {formData.habilidades.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="ml-2 inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNewSkill}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Agregar Habilidad
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-5 space-x-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  isSubmitting 
                    ? 'bg-blue-400' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                  </>
                ) : 'Generar CV'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCVPage;
