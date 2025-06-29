require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');
const { generatePDF } = require('./utils/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir cualquier origen
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En producción, restringir orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3000',
      // Agregar aquí otros orígenes permitidos en producción
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Manejar solicitudes preflight
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../client/views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.use(express.static(path.join(__dirname, '../client/public')));

app.get('/', (req, res) => {
  res.render('index', { title: 'Inicio', activePage: 'inicio' });
});

app.get('/crear-cv', (req, res) => {
  res.render('crear-cv', { title: 'Crear CV', activePage: 'crear-cv' });
});

app.get('/plantillas', (req, res) => {
  res.render('plantillas', { title: 'Plantillas', activePage: 'plantillas' });
});

// Ruta para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Ruta para generar el CV
app.post('/api/generate-cv', async (req, res) => {
  try {
    console.log('Solicitud de generación de CV recibida:', JSON.stringify(req.body, null, 2));
    
    const cvData = req.body;
    
    // Validar datos básicos
    if (!cvData || typeof cvData !== 'object') {
      console.error('Error: Datos del CV no proporcionados o inválidos');
      return res.status(400).json({ 
        success: false, 
        message: 'Datos del CV no proporcionados o inválidos' 
      });
    }

    // Validar campos obligatorios
    const requiredFields = ['nombreCompleto', 'email'];
    const missingFields = requiredFields.filter(field => !cvData[field]);
    
    if (missingFields.length > 0) {
      console.error('Error: Faltan campos obligatorios:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios',
        missingFields
      });
    }

    try {
      // Generar nombre de archivo único
      const timestamp = Date.now();
      const safeName = (cvData.nombreCompleto || 'cv')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
        
      const fileName = `cv-${safeName}-${timestamp}.pdf`;
      const filePath = path.join(__dirname, '../generated', fileName);
      
      console.log('Generando PDF para:', cvData.nombreCompleto);
      console.log('Ruta del archivo:', filePath);
      
      // Asegurarse de que el directorio generado existe
      const generatedDir = path.join(__dirname, '../generated');
      if (!fs.existsSync(generatedDir)) {
        console.log('Creando directorio generated');
        fs.mkdirSync(generatedDir, { recursive: true });
      }
      
      // Generar el PDF
      console.log('Iniciando generación de PDF...');
      const pdfBuffer = await generatePDF(cvData);
      console.log('PDF generado correctamente, tamaño:', pdfBuffer.length, 'bytes');
      
      // Guardar el archivo
      console.log('Guardando archivo en:', filePath);
      fs.writeFileSync(filePath, pdfBuffer);
      console.log('Archivo guardado correctamente');
      
      // Crear URL para descargar el archivo
      const fileUrl = `/api/download/${fileName}`;
      
      const result = {
        success: true,
        message: 'CV generado exitosamente',
        fileUrl: fileUrl,
        fileName: fileName,
        timestamp: new Date().toISOString()
      };
      
      console.log('Respuesta exitosa:', JSON.stringify(result, null, 2));
      res.json(result);
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al generar el PDF: ' + error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } catch (error) {
    console.error('Error al generar el CV:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al generar el CV',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.path
  });
});

// Ruta para descargar el CV generado
app.get('/api/download/:filename', (req, res) => {
  try {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, '../generated', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'El archivo solicitado no existe o ha expirado'
      });
    }
    
    // Configurar headers para la descarga
    res.download(filePath, `CV-${fileName}`, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error al descargar el archivo'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error en la descarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la descarga',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
