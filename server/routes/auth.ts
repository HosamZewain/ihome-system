import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users]: any = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Get Permissions
        let permissions: string[] = [];
        if (user.role_id) {
            // If Admin role (full access check by name or just assume Admin has all? Let's use permission table properly)
            // Or if the role is 'Admin' by name, give 'all'.
            const [roles]: any = await pool.query('SELECT name FROM roles WHERE id = ?', [user.role_id]);

            if (roles[0] && roles[0].name === 'Admin') {
                permissions = ['all'];
            } else {
                const [perms]: any = await pool.query(`
                SELECT p.code 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = ?
            `, [user.role_id]);
                permissions = perms.map((p: any) => p.code);
            }
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, roleId: user.role_id, permissions },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, fullName: user.full_name, roleId: user.role_id, permissions } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Me (Get current user)
router.get('/me', authenticateToken, async (req: any, res) => {
    try {
        const [users]: any = await pool.query(`
            SELECT u.id, u.username, u.full_name as fullName, u.role_id as roleId 
            FROM users u WHERE u.id = ?
        `, [req.user.id]);

        if (users.length === 0) return res.status(401).send();

        const user = users[0];
        // Fetch permissions correctly
        let permissions: string[] = [];
        if (user.roleId) {
            const [roles]: any = await pool.query('SELECT name FROM roles WHERE id = ?', [user.roleId]);
            if (roles[0] && roles[0].name === 'Admin') {
                permissions = ['all'];
            } else {
                const [perms]: any = await pool.query(`
                    SELECT p.code FROM permissions p
                    JOIN role_permissions rp ON p.id = rp.permission_id
                    WHERE rp.role_id = ?
                `, [user.roleId]);
                permissions = perms.map((p: any) => p.code);
            }
        }
        user.permissions = permissions;
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
