# Generador de CV con IA

[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)

Un generador de CV moderno impulsado por IA que ayuda a los usuarios a crear currículums profesionales con sugerencias inteligentes y plantillas atractivas.

## 🚀 Características

- **Generación de Contenido con IA**: Obtén sugerencias inteligentes para el contenido de tu CV
- **Múltiples Plantillas**: Elige entre plantillas de CV diseñadas profesionalmente
- **Vista Previa en Tiempo Real**: Visualiza los cambios mientras construyes tu CV
- **Exportación a PDF**: Descarga tu CV como un documento PDF pulido
- **Diseño Responsivo**: Se ve genial en cualquier dispositivo
- **Autenticación de Usuarios**: Cuentas seguras y gestión de perfiles

## 🛠 Tecnologías

### Backend
- **Entorno de Ejecución**: Node.js
- **Framework**: Express.js
- **Motor de Plantillas**: EJS
- **Generación de PDF**: html-pdf-node
- **Web Scraping**: Playwright
- **Cliente API**: Axios

### Frontend
- **Framework UI**: React
- **Estilos**: CSS moderno con diseño responsivo
- **Gestión de Estado**: React Context API
- **Manejo de Formularios**: React Hook Form
- **Visor de PDF**: React-PDF

## 🚀 Comenzando

### Requisitos Previos

- Node.js 18.x o superior
- npm 9.x o superior
- Git

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tuusuario/cv-generator-ia.git
   cd cv-generator-ia
   ```

2. Instala las dependencias:
   ```bash
   # Instalar dependencias del servidor
   npm install
   
   # Instalar dependencias del cliente
   cd client
   npm install
   cd ..
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Actualiza el archivo `.env` con tu configuración.

### Configuración

Crea un archivo `.env` en el directorio raíz con las siguientes variables:

```env
PORT=3001
NODE_ENV=development
OPENAI_API_KEY=tu_clave_api_openai
SESSION_SECRET=tu_secreto_de_sesion
MONGODB_URI=tu_url_de_mongodb
```

## 🏃‍♂️ Ejecutando la Aplicación

### Modo Desarrollo

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. En una nueva terminal, inicia el servidor de desarrollo de React:
   ```bash
   cd client
   npm start
   ```

3. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### Compilación para Producción

1. Construye la aplicación React:
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. Inicia el servidor de producción:
   ```bash
   npm start
   ```

## 🏗 Estructura del Proyecto

```
cv-generator-ia/
├── client/                 # Frontend en React
│   ├── public/            # Archivos estáticos
│   └── src/               # Código fuente de React
│       ├── components/    # Componentes UI reutilizables
│       ├── contexts/      # Contextos de React
│       ├── pages/         # Componentes de página
│       └── styles/        # Estilos globales
├── server/                # Backend en Express
│   ├── config/           # Archivos de configuración
│   ├── controllers/      # Controladores de rutas
│   ├── middleware/       # Middleware personalizado
│   ├── models/           # Modelos de base de datos
│   ├── routes/           # Rutas de la API
│   └── utils/            # Funciones de utilidad
├── templates/            # Plantillas EJS para generación de PDF
├── .env                  # Variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## 📚 Documentación de la API

### Autenticación

- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener información del usuario actual

### Gestión de CVs

- `GET /api/cv` - Obtener todos los CVs del usuario actual
- `POST /api/cv` - Crear un nuevo CV
- `GET /api/cv/:id` - Obtener un CV específico
- `PUT /api/cv/:id` - Actualizar un CV
- `DELETE /api/cv/:id` - Eliminar un CV
- `POST /api/cv/:id/generate` - Generar PDF de un CV

## 🤝 Cómo Contribuir

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1. Haz un fork del repositorio
2. Crea una rama nueva (`git checkout -b feature/mi-increible-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añade una funcionalidad increíble'`)
4. Sube los cambios a la rama (`git push origin feature/mi-increible-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Reconocimientos

- [OpenAI](https://openai.com/) por las capacidades de IA
- [React](https://reactjs.org/) por la biblioteca de frontend
- [Express](https://expressjs.com/) por el framework de backend
- A todos los colaboradores que han ayudado a mejorar este proyecto
