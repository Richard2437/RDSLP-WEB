/* =====================================================
   RDSLP - Módulo de Conexión a MySQL
   Usa mysql2 con soporte para promesas (async/await)
===================================================== */

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rdslp_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificar conexión al iniciar
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado a MySQL - Base de datos:', process.env.DB_NAME || 'rdslp_db');
        connection.release();
        return true;
    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
        console.error('   Verifica que MySQL esté corriendo y que la base de datos exista.');
        return false;
    }
}

module.exports = { pool, testConnection };
