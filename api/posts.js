/* =====================================================
   RDSLP - Rutas de Publicaciones (Muro Social)
===================================================== */

const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// ==================== OBTENER PUBLICACIONES ====================
router.get('/', async (req, res) => {
    try {
        const { type, language } = req.query;

        let query = `
            SELECT p.id, p.autor_id AS authorId, u.nombre AS authorName, 
                   p.tipo AS type, p.lenguaje AS language, p.contenido AS content,
                   p.imagen_url AS image, p.video_url AS video,
                   p.codigo AS code, p.puntuacion_codigo AS score,
                   p.created_at AS createdAt
            FROM publicaciones p
            JOIN usuarios u ON p.autor_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (type && type !== 'all') {
            query += ' AND p.tipo = ?';
            params.push(type);
        }
        if (language && language !== 'all') {
            query += ' AND p.lenguaje = ?';
            params.push(language);
        }

        query += ' ORDER BY p.created_at DESC';

        const [posts] = await pool.query(query, params);

        // Obtener likes y comentarios para cada post
        for (const post of posts) {
            const [likes] = await pool.query(
                'SELECT usuario_id FROM likes WHERE publicacion_id = ?',
                [post.id]
            );
            post.likes = likes.map(l => l.usuario_id);

            const [comments] = await pool.query(
                `SELECT c.id, c.autor_id AS authorId, u.nombre AS authorName, 
                        c.texto AS text, c.created_at AS createdAt
                 FROM comentarios c
                 JOIN usuarios u ON c.autor_id = u.id
                 WHERE c.publicacion_id = ?
                 ORDER BY c.created_at ASC`,
                [post.id]
            );
            post.comments = comments;
        }

        res.json({ success: true, posts });

    } catch (error) {
        console.error('Error obteniendo publicaciones:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== CREAR PUBLICACIÓN ====================
router.post('/', async (req, res) => {
    try {
        const { authorId, type, language, content, image, video, code, score } = req.body;

        if (!authorId || !content) {
            return res.status(400).json({ success: false, message: 'Autor y contenido requeridos' });
        }

        const [result] = await pool.query(
            `INSERT INTO publicaciones (autor_id, tipo, lenguaje, contenido, imagen_url, video_url, codigo, puntuacion_codigo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [authorId, type || 'general', language || null, content, image || null, video || null, code || null, score || null]
        );

        res.json({
            success: true,
            post: {
                id: result.insertId,
                authorId,
                type: type || 'general',
                language,
                content,
                image,
                video,
                code,
                score,
                likes: [],
                comments: [],
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creando publicación:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== ELIMINAR PUBLICACIÓN ====================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM publicaciones WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error eliminando publicación:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== TOGGLE LIKE ====================
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        // Verificar si ya dio like
        const [existing] = await pool.query(
            'SELECT id FROM likes WHERE publicacion_id = ? AND usuario_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            // Quitar like
            await pool.query('DELETE FROM likes WHERE publicacion_id = ? AND usuario_id = ?', [id, userId]);
            res.json({ success: true, liked: false });
        } else {
            // Dar like
            await pool.query('INSERT INTO likes (publicacion_id, usuario_id) VALUES (?, ?)', [id, userId]);
            res.json({ success: true, liked: true });
        }

    } catch (error) {
        console.error('Error en like:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== AGREGAR COMENTARIO ====================
router.post('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { authorId, text } = req.body;

        if (!text || !authorId) {
            return res.status(400).json({ success: false, message: 'Texto y autor requeridos' });
        }

        const [result] = await pool.query(
            'INSERT INTO comentarios (publicacion_id, autor_id, texto) VALUES (?, ?, ?)',
            [id, authorId, text]
        );

        const [user] = await pool.query('SELECT nombre FROM usuarios WHERE id = ?', [authorId]);

        res.json({
            success: true,
            comment: {
                id: result.insertId,
                authorId,
                authorName: user[0]?.nombre || 'Usuario',
                text,
                createdAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error agregando comentario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== EDITAR COMENTARIO ====================
router.put('/:postId/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body;

        await pool.query(
            'UPDATE comentarios SET texto = ? WHERE id = ?',
            [text, commentId]
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error editando comentario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== ELIMINAR COMENTARIO ====================
router.delete('/:postId/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        await pool.query('DELETE FROM comentarios WHERE id = ?', [commentId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
