/* =====================================================
   RDSLP - Rutas de Ejercicios
===================================================== */
const express = require('express');
const router = express.Router();
const { pool } = require('./db');

router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;
        let query = `SELECT id, usuario_id AS userId, titulo AS exercise, lenguaje AS language,
                     codigo AS code, puntuacion_total AS score, funcionalidad AS functionality,
                     codigo_limpio AS cleanCode, eficiencia AS efficiency,
                     buenas_practicas AS bestPractices, feedback, compartido AS shared,
                     created_at AS createdAt FROM ejercicios`;
        const params = [];
        if (userId) { query += ' WHERE usuario_id = ?'; params.push(userId); }
        query += ' ORDER BY created_at DESC LIMIT 20';
        const [exercises] = await pool.query(query, params);
        exercises.forEach(ex => {
            if (ex.feedback) ex.feedback = ex.feedback.split('|');
            ex.evaluation = { total: ex.score, functionality: ex.functionality, cleanCode: ex.cleanCode, efficiency: ex.efficiency, bestPractices: ex.bestPractices, feedback: ex.feedback || [] };
        });
        res.json({ success: true, exercises });
    } catch (error) {
        console.error('Error obteniendo ejercicios:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { userId, exercise, language, code, evaluation } = req.body;
        if (!userId || !code) return res.status(400).json({ success: false, message: 'Datos incompletos' });
        const feedback = evaluation?.feedback ? evaluation.feedback.join('|') : '';
        const [result] = await pool.query(
            `INSERT INTO ejercicios (usuario_id, titulo, lenguaje, codigo, puntuacion_total, funcionalidad, codigo_limpio, eficiencia, buenas_practicas, feedback, compartido)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
            [userId, exercise || 'Libre', language || 'javascript', code, evaluation?.total || 0, evaluation?.functionality || 0, evaluation?.cleanCode || 0, evaluation?.efficiency || 0, evaluation?.bestPractices || 0, feedback]
        );
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error guardando ejercicio:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
