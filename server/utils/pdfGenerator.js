const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');

// Función para renderizar la plantilla EJS con los datos del CV
async function renderCVTemplate(cvData) {
  try {
    const templatePath = path.join(__dirname, '../../templates/cv-template.ejs');
    const template = fs.readFileSync(templatePath, 'utf-8');
    
    // Datos adicionales para la plantilla
    const templateData = {
      ...cvData,
      currentDate: new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
    
    // Renderizar la plantilla con los datos
    return ejs.render(template, templateData);
  } catch (error) {
    console.error('Error al renderizar la plantilla:', error);
    throw new Error('No se pudo generar el CV: error en la plantilla');
  }
}

// Función principal para generar el PDF
async function generatePDF(cvData) {
  let browser;
  try {
    // Renderizar la plantilla HTML
    const html = await renderCVTemplate(cvData);
    
    // Iniciar el navegador
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Configurar el contenido HTML
    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Generar el PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw new Error('No se pudo generar el PDF: ' + error.message);
  } finally {
    // Cerrar el navegador
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generatePDF };
