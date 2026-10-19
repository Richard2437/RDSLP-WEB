/* =====================================================
   RDSLP - Rutas de Autenticación y Usuarios
===================================================== */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { pool } = require('./db');

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Correo y contraseña requeridos' });
        }

        const [rows] = await pool.query(
            `SELECT u.*, r.nombre AS role FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.email = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        const user = rows[0];

        // Verificar contraseña (soporta tanto hash como texto plano para migración)
        let passwordValid = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Texto plano (datos de prueba) — actualizar a hash
            passwordValid = (password === user.password);
            if (passwordValid) {
                const hash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, user.id]);
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
        }

        if (user.is_banned) {
            return res.status(403).json({ success: false, message: 'Tu cuenta ha sido suspendida. Contacta al administrador.' });
        }

        const userData = {
            id: user.id,
            email: user.email,
            name: user.nombre,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            loginTime: new Date().toISOString()
        };

        res.json({ success: true, user: userData });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== REGISTRO ====================
router.post('/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;

        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
        }

        // Verificar si el email ya existe
        const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Este correo ya está registrado' });
        }

        const hash = await bcrypt.hash(password, 10);
        const nombre = `${firstName} ${lastName}`;
        const avatar = firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();

        const [result] = await pool.query(
            'INSERT INTO usuarios (email, password, nombre, avatar, bio, rol_id) VALUES (?, ?, ?, ?, ?, 1)',
            [email, hash, nombre, avatar, '']
        );

        res.json({
            success: true,
            user: {
                id: result.insertId,
                email,
                name: nombre,
                role: 'user',
                avatar,
                bio: ''
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== ACTUALIZAR PERFIL ====================
router.put('/profile', async (req, res) => {
    try {
        const { userId, name, bio, currentPassword, newPassword } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'Usuario no identificado' });
        }

        const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const user = rows[0];

        // Si quiere cambiar contraseña, verificar la actual
        if (newPassword) {
            let currentValid = false;
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                currentValid = await bcrypt.compare(currentPassword, user.password);
            } else {
                currentValid = (currentPassword === user.password);
            }

            if (!currentValid) {
                return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
            }

            const hash = await bcrypt.hash(newPassword, 10);
            await pool.query('UPDATE usuarios SET password = ? WHERE id = ?', [hash, userId]);
        }

        // Actualizar nombre y bio
        if (name || bio !== undefined) {
            await pool.query(
                'UPDATE usuarios SET nombre = COALESCE(?, nombre), bio = COALESCE(?, bio) WHERE id = ?',
                [name || null, bio !== undefined ? bio : null, userId]
            );
        }

        // Devolver usuario actualizado
        const [updated] = await pool.query(
            `SELECT u.*, r.nombre AS role FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
            [userId]
        );

        const u = updated[0];
        res.json({
            success: true,
            user: {
                id: u.id,
                email: u.email,
                name: u.nombre,
                role: u.role,
                avatar: u.avatar,
                bio: u.bio
            }
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== LISTAR USUARIOS (Admin) ====================
router.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id, u.email, u.nombre AS name, u.avatar, u.bio, 
                    r.nombre AS role, u.is_banned AS isBanned, u.created_at AS createdAt
             FROM usuarios u
             JOIN roles r ON u.rol_id = r.id
             ORDER BY u.id`
        );
        res.json({ success: true, users: rows });
    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== CAMBIAR ROL (Admin) ====================
router.put('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const [roleRows] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [role]);
        if (roleRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Rol no válido' });
        }

        await pool.query('UPDATE usuarios SET rol_id = ? WHERE id = ?', [roleRows[0].id, id]);
        res.json({ success: true });

    } catch (error) {
        console.error('Error cambiando rol:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

// ==================== BANEAR/DESBANEAR (Admin) ====================
router.put('/users/:id/ban', async (req, res) => {
    try {
        const { id } = req.params;
        const { ban } = req.body;

        // No permitir banear admins
        const [user] = await pool.query(
            `SELECT r.nombre AS role FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`,
            [id]
        );
        if (user.length > 0 && user[0].role === 'admin') {
            return res.status(403).json({ success: false, message: 'No puedes banear a un administrador' });
        }

        await pool.query('UPDATE usuarios SET is_banned = ? WHERE id = ?', [ban ? 1 : 0, id]);
        res.json({ success: true });

    } catch (error) {
        console.error('Error baneando usuario:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
    }
});

module.exports = router;
