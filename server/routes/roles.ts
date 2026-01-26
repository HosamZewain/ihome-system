import express from 'express';
import pool from '../db.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// List Roles
router.get('/', requirePermission('roles.view'), async (req, res) => {
    try {
        const [roles]: any = await pool.query('SELECT * FROM roles');
        const rolesWithPerms = await Promise.all(roles.map(async (role: any) => {
            const [perms]: any = await pool.query(`
        SELECT p.id, p.code 
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [role.id]);
            return {
                id: role.id,
                name: role.name,
                description: role.description,
                createdAt: role.created_at,
                permissions: perms.map((p: any) => p.code)
            };
        }));
        res.json(rolesWithPerms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching roles' });
    }
});

// List Permissions
router.get('/permissions', requirePermission('roles.view'), async (req, res) => {
    try {
        const [perms] = await pool.query('SELECT * FROM permissions');
        res.json(perms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching permissions' });
    }
});

// Create Role
router.post('/', requirePermission('roles.create'), async (req, res) => {
    const { name, description, permissions } = req.body; // permissions is array of codes or ids? Let's say IDs or Codes. Codes are safer.
    // Actually, let's assume permissions is array of Permission IDs for simplicity in UI matching.
    try {
        const roleId = await pool.query('INSERT INTO roles (id, name, description) VALUES (UUID(), ?, ?)', [name, description]);
        // Insert ID... wait, UUID() generates it. I need to select it back or generate in Node.
        // Let's generate in Node for this one to be safe.
        // Actually, I can use UUID() and then SELECT id FROM roles WHERE name = ?
        // But name is unique.

        // Easier:
        const [insertedRole]: any = await pool.query('SELECT id FROM roles WHERE name = ?', [name]);
        const newRoleId = insertedRole[0].id; // Wait, INSERT is async. I need to await it. Oh I did.

        // But first query was INSERT.
        // The previous `pool.query` returns [ResultSetHeader].
        // If I use UUID() in SQL, result doesn't possess the ID.
        // So selecting by name is fine since name is unique.

        if (permissions && permissions.length > 0) {
            // Permissions is array of IDs?
            for (const permId of permissions) {
                await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [newRoleId, permId]);
            }
        }

        res.status(201).json({ message: 'Role created' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating role' });
    }
});

// Update Role
router.put('/:id', requirePermission('roles.edit'), async (req, res) => {
    const { name, description, permissions } = req.body;
    try {
        await pool.query('UPDATE roles SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);

        // Update perms: Delete all, then insert new
        await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);

        if (permissions && permissions.length > 0) {
            for (const permId of permissions) {
                await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [req.params.id, permId]);
            }
        }
        res.json({ message: 'Role updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating role' });
    }
});

// Delete Role
router.delete('/:id', requirePermission('roles.delete'), async (req, res) => {
    try {
        await pool.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
        res.json({ message: 'Role deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting role' });
    }
});

export default router;
