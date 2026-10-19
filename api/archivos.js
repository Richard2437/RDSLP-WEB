const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get('/:lenguaje_id', async (req, res) => {
    try {
        const { lenguaje_id } = req.params;
        const [archivos] = await pool.query(
            'SELECT a.*, u.nombre as autor_subida FROM archivos_lenguajes a JOIN usuarios u ON a.usuario_id = u.id WHERE a.lenguaje_id = ? ORDER BY a.created_at DESC',
            [lenguaje_id]
        );
        res.json({ success: true, archivos });
    } catch (error) {
        console.error('Error obteniendo archivos:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { lenguaje_id, nombre_archivo, dificultad, contenido, usuario_id } = req.body;
        if (!lenguaje_id || !nombre_archivo || !usuario_id) return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
        
        const [result] = await pool.query(
            'INSERT INTO archivos_lenguajes (lenguaje_id, nombre_archivo, dificultad, contenido, usuario_id) VALUES (?, ?, ?, ?, ?)',
            [lenguaje_id, nombre_archivo, dificultad || 'Fácil', contenido || '', usuario_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error guardando archivo:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
