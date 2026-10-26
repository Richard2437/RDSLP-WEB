/* =====================================================
   RDSLP - Servidor Express Principal
   Red Social de Lenguajes de Programación
===================================================== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos principales con soporte para URLs sin extensión .html
const staticOptions = { extensions: ['html', 'htm'] };
app.use('/Static', express.static(path.join(__dirname, 'Static'), staticOptions));
app.use('/JS', express.static(path.join(__dirname, 'JS')));
app.use('/Styles', express.static(path.join(__dirname, 'Styles')));

// Lenguajes
app.use('/LanguagesSection', express.static(path.join(__dirname, 'LanguagesSection')));
app.use('/LanguagesSection_css', express.static(path.join(__dirname, 'LanguagesSection_css')));
app.use('/LanguagesSection_js', express.static(path.join(__dirname, 'LanguagesSection_js')));

// Bases de Datos
app.use('/DatabasesSection', express.static(path.join(__dirname, 'DatabasesSection')));
app.use('/DatabasesSection_css', express.static(path.join(__dirname, 'DatabasesSection_css')));
app.use('/DatabasesSection_js', express.static(path.join(__dirname, 'DatabasesSection_js')));

// Rutas de la API
app.use('/api/auth', require('./api/auth'));
app.use('/api/posts', require('./api/posts'));
app.use('/api/community', require('./api/community'));
app.use('/api/content', require('./api/content'));
app.use('/api/exercises', require('./api/exercises'));
app.use('/api/libros', require('./api/libros'));
app.use('/api/archivos', require('./api/archivos'));
app.use('/api/databases', require('./api/databases'));

// Ruta raíz y rutas directas amigables
app.get('/', (req, res) => res.redirect('/Static/login.html'));
app.get('/login', (req, res) => res.redirect('/Static/login.html'));
app.get('/dashboard', (req, res) => res.redirect('/Static/dashboard.html'));
app.get('/sesion', (req, res) => res.redirect('/Static/sesion.html'));
app.get('/registro', (req, res) => res.redirect('/Static/sesion.html'));

// Endpoint de configuración para Supabase
app.get('/api/config', require('./api/config'));

// Health check para que el frontend sepa si el server está activo
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', database: 'Supabase', timestamp: new Date().toISOString() });
});

// Iniciar servidor
function start() {
    app.listen(PORT, () => {
        console.log(`\nServidor RDSLP corriendo en http://localhost:${PORT}`);
        console.log(`Frontend: http://localhost:${PORT}/Static/login.html`);
        console.log(`Base de datos: Conectada a Supabase \n`);
    });
}

start();