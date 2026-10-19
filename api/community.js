/* =====================================================
   RDSLP - Rutas de Comunidad (Chat y Eventos)
===================================================== */

const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// ==================== MENSAJES ====================

// Obtener mensajes de un chat
router.get('/messages/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;

        const [messages] = await pool.query(
            `SELECT m.id, m.chat_id AS chatId, m.autor_id AS authorId, 
                    u.nombre AS authorName, m.texto AS text, m.created_at AS createdAt
             FROM mensajes m
             JOIN usuarios u ON m.autor_id = u.id
             WHERE m.chat_id = ?
             ORDER BY m.created_at ASC`,
            [chatId]
        );

        res.json({ success: true, messages });

    } catch (error) {
        console.error('Error obteniendo mensajes:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Enviar mensaje
router.post('/messages', async (req, res) => {
    try {
        const { chatId, text, authorId } = req.body;

        if (!text || !authorId) {
            return res.status(400).json({ success: false, message: 'Texto y autor requeridos' });
        }

        const [result] = await pool.query(
            'INSERT INTO mensajes (chat_id, autor_id, texto) VALUES (?, ?, ?)',
            [chatId || 'general', authorId, text]
        );

        const [user] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [authorId]);

        res.json({
            success: true,
            message: {
                id: result.insertId,
                chatId: chatId || 'general',
                authorId,
                authorName: user[0]?.nombre || 'Usuario',
                text,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== EVENTOS ====================

// Obtener todos los eventos
router.get('/events', async (req, res) => {
    try {
        const [events] = await pool.query(
            `SELECT e.id, e.titulo AS title, e.descripcion AS description, 
                    e.fecha AS date, e.organizador_id,
                    u.nombre AS organizerName, u.email AS organizer,
                    e.categoria AS category, e.max_participantes AS maxParticipants,
                    e.estado AS status, e.created_at AS createdAt
             FROM eventos e
             JOIN usuarios u ON e.organizador_id = u.id
             ORDER BY e.fecha ASC`
        );

        // Obtener participantes de cada evento
        for (const event of events) {
            const [participants] = await pool.query(
                `SELECT ep.usuario_id AS id, u.nombre AS name, ep.joined_at AS joinedAt
                 FROM evento_participantes ep
                 JOIN usuarios u ON ep.usuario_id = u.id
                 WHERE ep.evento_id = ?`,
                [event.id]
            );
            event.participants = participants;
        }

        res.json({ success: true, events });

    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Crear evento
router.post('/events', async (req, res) => {
    try {
        const { title, description, date, maxParticipants, category, organizerId } = req.body;

        if (!title || !date || !organizerId) {
            return res.status(400).json({ success: false, message: 'Título, fecha y organizador requeridos' });
        }

        const [result] = await pool.query(
            `INSERT INTO eventos (titulo, descripcion, fecha, organizador_id, categoria, max_participantes, estado)
             VALUES (?, ?, ?, ?, ?, ?, 'upcoming')`,
            [title, description || '', date, organizerId, category || 'general', maxParticipants || 20]
        );

        const [user] = await pool.query('SELECT nombre, email FROM usuarios WHERE id = ?', [organizerId]);

        res.json({
            success: true,
            event: {
                id: result.insertId,
                title,
                description,
                date,
                organizer: user[0]?.email,
                organizerName: user[0]?.nombre,
                category,
                maxParticipants: maxParticipants || 20,
                participants: [],
                status: 'upcoming',
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creando evento:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Unirse a evento
router.post('/events/:id/join', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        // Verificar si ya está inscrito
        const [existing] = await pool.query(
            'SELECT id FROM evento_participantes WHERE evento_id = ? AND usuario_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Ya estás inscrito en este evento' });
        }

        // Verificar capacidad
        const [event] = await pool.query('SELECT max_participantes FROM eventos WHERE id = ?', [id]);
        const [count] = await pool.query('SELECT COUNT(*) AS total FROM evento_participantes WHERE evento_id = ?', [id]);

        if (event.length > 0 && count[0].total >= event[0].max_participantes) {
            return res.status(409).json({ success: false, message: 'El evento está lleno' });
        }

        await pool.query(
            'INSERT INTO evento_participantes (evento_id, usuario_id) VALUES (?, ?)',
            [id, userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error uniéndose a evento:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Salir de evento
router.post('/events/:id/leave', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        await pool.query(
            'DELETE FROM evento_participantes WHERE evento_id = ? AND usuario_id = ?',
            [id, userId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error saliendo de evento:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// Eliminar evento
router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM eventos WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error eliminando evento:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
