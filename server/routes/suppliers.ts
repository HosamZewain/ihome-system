import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all suppliers
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers ORDER BY name');
        const suppliers = rows.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            address: s.address,
            createdAt: s.created_at
        }));
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// Create supplier
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;
        const id = uuidv4();

        await pool.query<ResultSetHeader>(
            'INSERT INTO suppliers (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [id, name, email || '', phone || '', address || '']
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [id]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// Update supplier
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, address } = req.body;

        await pool.query<ResultSetHeader>(
            'UPDATE suppliers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            [name, email, phone, address, req.params.id]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
    try {
        await pool.query<ResultSetHeader>('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});

export default router;
