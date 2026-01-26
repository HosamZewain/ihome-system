import { Router } from 'express';
import pool from '../db.js';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Export Database as JSON
router.get('/export', requirePermission('system.backup'), async (req, res) => {
    try {
        const tables = [
            'products', 'customers', 'invoices', 'invoice_items',
            'expense_categories', 'expenses', 'suppliers',
            'purchase_invoices', 'purchase_items', 'roles', 'permissions', 'users'
        ];

        const backup: any = {};
        for (const table of tables) {
            const [rows] = await pool.query(`SELECT * FROM ${table}`);
            backup[table] = rows;
        }

        const fileName = `backup-${Date.now()}.json`;
        const filePath = `public/uploads/backups/${fileName}`;
        fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

        res.download(filePath, fileName, (err) => {
            if (err) console.error('Download error:', err);
            // Optionally delete after download, but keeping for record
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export database' });
    }
});

// Import Database from JSON
router.post('/import', requirePermission('system.restore'), upload.single('backup'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const connection = await pool.getConnection();
    try {
        const backup = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
        await connection.beginTransaction();

        // Disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = Object.keys(backup);
        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
            const rows = backup[table];
            if (rows.length > 0) {
                const keys = Object.keys(rows[0]);
                const values = rows.map((row: any) => keys.map(key => row[key]));
                await connection.query(
                    `INSERT INTO ${table} (${keys.join(', ')}) VALUES ?`,
                    [values]
                );
            }
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        fs.unlinkSync(req.file.path);

        res.json({ message: 'Database successfully restored' });
    } catch (error) {
        await connection.rollback();
        console.error('Import error:', error);
        res.status(500).json({ error: 'Failed to import backup' });
    } finally {
        connection.release();
    }
});

export default router;
