/* =====================================================
   RDSLP - Rutas de Contenido y Calificaciones
===================================================== */
const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        let query = `SELECT c.id, c.autor_id AS authorId, u.nombre AS authorName,
                   c.titulo AS title, c.descripcion AS description,
                   c.categoria AS category, c.tipo AS type, c.url,
                   c.created_at AS createdAt
            FROM contenido c JOIN usuarios u ON c.autor_id = u.id WHERE 1=1`;
        const params = [];
        if (category) { query += ' AND c.categoria = ?'; params.push(category); }
        query += ' ORDER BY c.created_at DESC';
        const [content] = await pool.query(query, params);
        res.json({ success: true, content });
    } catch (error) {
        console.error('Error obteniendo contenido:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

router.post('/:id/rate', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, rating } = req.body;
        if (!userId || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating inválido (1-5)' });
        }
        await pool.query(
            `INSERT INTO calificaciones (contenido_id, usuario_id, calificacion) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE calificacion = ?, updated_at = CURRENT_TIMESTAMP`,
            [id, userId, rating, rating]
        );
        const [avg] = await pool.query(
            `SELECT ROUND(AVG(calificacion), 1) AS average, COUNT(*) AS count FROM calificaciones WHERE contenido_id = ?`, [id]
        );
        res.json({ success: true, average: avg[0].average || 0, count: avg[0].count || 0 });
    } catch (error) {
        console.error('Error calificando:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

router.get('/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;
        const [avg] = await pool.query(
            `SELECT ROUND(AVG(calificacion), 1) AS average, COUNT(*) AS count FROM calificaciones WHERE contenido_id = ?`, [id]
        );
        let userRating = 0;
        if (userId) {
            const [ur] = await pool.query('SELECT calificacion FROM calificaciones WHERE contenido_id = ? AND usuario_id = ?', [id, userId]);
            userRating = ur.length > 0 ? ur[0].calificacion : 0;
        }
        res.json({ success: true, average: avg[0].average || 0, count: avg[0].count || 0, userRating });
    } catch (error) {
        console.error('Error obteniendo calificación:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
