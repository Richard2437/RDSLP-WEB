const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get('/', async (req, res) => {
    try {
        const [libros] = await pool.query('SELECT l.*, u.nombre as autor_subida, u.avatar as autor_avatar FROM libros l JOIN usuarios u ON l.usuario_id = u.id ORDER BY l.created_at DESC');
        res.json({ success: true, libros });
    } catch (error) {
        console.error('Error obteniendo libros:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { titulo, autor, descripcion, url, usuario_id } = req.body;
        if (!titulo || !usuario_id) return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });

        // Verificar duplicado por titulo (case insensitive)
        const [existing] = await pool.query(
            'SELECT id FROM libros WHERE LOWER(titulo) = LOWER(?)',
            [titulo]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Ya existe un libro con ese titulo' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO libros (titulo, autor, descripcion, url, usuario_id) VALUES (?, ?, ?, ?, ?)',
            [titulo, autor || '', descripcion || '', url || '', usuario_id]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error guardando libro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Eliminar libro (solo admin o moderador)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id, role } = req.body;
        
        if (!usuario_id || !role) {
            return res.status(400).json({ success: false, message: 'Faltan datos de autorizacion' });
        }
        
        if (role !== 'admin' && role !== 'moderator') {
            return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar libros' });
        }
        
        await pool.query('DELETE FROM libros WHERE id = ?', [id]);
        res.json({ success: true, message: 'Libro eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando libro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
