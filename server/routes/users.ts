import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// List Users
router.get('/', requirePermission('users.view'), async (req, res) => {
    try {
        const [rows]: any = await pool.query(`
      SELECT u.id, u.username, u.full_name, u.role_id, r.name as role_name, u.created_at 
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
    `);
        const users = rows.map((u: any) => ({
            id: u.id,
            username: u.username,
            fullName: u.full_name,
            roleId: u.role_id,
            roleName: u.role_name,
            createdAt: u.created_at
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Create User
router.post('/', requirePermission('users.create'), async (req, res) => {
    const { username, password, fullName, roleId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (id, username, password_hash, full_name, role_id) VALUES (UUID(), ?, ?, ?, ?)',
            [username, hashedPassword, fullName, roleId]
        );
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Update User
router.put('/:id', requirePermission('users.edit'), async (req, res) => {
    const { fullName, roleId, password } = req.body;
    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE users SET full_name = ?, role_id = ?, password_hash = ? WHERE id = ?',
                [fullName, roleId, hashedPassword, req.params.id]
            );
        } else {
            await pool.query(
                'UPDATE users SET full_name = ?, role_id = ? WHERE id = ?',
                [fullName, roleId, req.params.id]
            );
        }
        res.json({ message: 'User updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete User
router.delete('/:id', requirePermission('users.delete'), async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

export default router;
