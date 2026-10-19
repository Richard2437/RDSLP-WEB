/* =====================================================
   RDSLP - Rutas de Motores de Bases de Datos
   api/databases.js
===================================================== */
const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// Obtener todas las bases de datos / motores
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM motores_db WHERE 1=1';
        const params = [];
        if (category && category !== 'todos') {
            query += ' AND category = ?';
            params.push(category);
        }
        query += ' ORDER BY id ASC';
        const [databases] = await pool.query(query, params);

        // Procesar features y tags de string a arrays
        const result = databases.map(db => ({
            ...db,
            features: db.features ? db.features.split('|') : [],
            tags: db.tags ? db.tags.split(',') : []
        }));

        res.json({ success: true, databases: result });
    } catch (error) {
        console.error('Error obteniendo motores de base de datos:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Obtener una base de datos específica por id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM motores_db WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Base de datos no encontrada' });
        }
        const db = rows[0];
        db.features = db.features ? db.features.split('|') : [];
        db.tags = db.tags ? db.tags.split(',') : [];
        res.json({ success: true, database: db });
    } catch (error) {
        console.error('Error obteniendo motor de base de datos:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Crear nueva base de datos / motor
router.post('/', async (req, res) => {
    try {
        const { id, name, abbr, type, category, color, tagline, description, features, tags, code } = req.body;
        if (!name || !abbr || !description) {
            return res.status(400).json({ success: false, message: 'Campos requeridos faltantes' });
        }

        const dbId = id || 'db-' + name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const featuresStr = Array.isArray(features) ? features.join('|') : (features || '');
        const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
        const file = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.html`;

        await pool.query(
            `INSERT INTO motores_db (id, name, abbr, type, file, category, color, tagline, description, features, tags, code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=?, abbr=?, description=?, features=?, tags=?, code=?`,
            [dbId, name, abbr, type || 'custom', file, category || 'relacional', color || '#6366f1', tagline || `Motor ${name}`, description, featuresStr, tagsStr, code || '',
             name, abbr, description, featuresStr, tagsStr, code || '']
        );

        res.json({ success: true, id: dbId });
    } catch (error) {
        console.error('Error guardando motor de base de datos:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
