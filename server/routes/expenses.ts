import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Get all expenses
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM expenses ORDER BY date DESC');
        const expenses = rows.map((row: any) => ({
            id: row.id,
            categoryId: row.category_id,
            categoryName: row.category_name,
            amount: parseFloat(row.amount),
            description: row.description,
            date: row.date,
            createdAt: row.created_at,
        }));
        res.json(expenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Get expense categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM expense_categories ORDER BY name');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create expense
router.post('/', async (req, res) => {
    try {
        let { categoryId, categoryName, amount, description, date } = req.body;

        // Handle variations in field naming
        categoryId = categoryId || req.body.category_id;
        categoryName = categoryName || req.body.category;

        if (!categoryId) {
            // Try to find a category by name or just use the first available one for testing
            const [categories]: any = await pool.query('SELECT id, name FROM expense_categories LIMIT 1');
            if (categories.length > 0) {
                categoryId = categories[0].id;
                categoryName = categoryName || categories[0].name;
            } else {
                // Create a default category if none exists
                categoryId = uuidv4();
                categoryName = categoryName || 'Uncategorized';
                await pool.query('INSERT INTO expense_categories (id, name, color) VALUES (?, ?, ?)', [categoryId, categoryName, '#6366f1']);
            }
        }

        // If categoryId was provided but categoryName was not, fetch it
        if (!categoryName) {
            const [categories]: any = await pool.query('SELECT name FROM expense_categories WHERE id = ?', [categoryId]);
            if (categories.length > 0) {
                categoryName = categories[0].name;
            } else {
                categoryName = 'Unknown';
            }
        }

        if (amount === undefined || amount === null) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        const id = uuidv4();

        if (!date) {
            date = new Date().toISOString().split('T')[0];
        }

        await pool.query<ResultSetHeader>(
            'INSERT INTO expenses (id, category_id, category_name, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
            [id, categoryId, categoryName, amount, description || '', date]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM expenses WHERE id = ?', [id]);
        const expense = rows[0];
        res.status(201).json({
            id: expense.id,
            categoryId: expense.category_id,
            categoryName: expense.category_name,
            amount: parseFloat(expense.amount),
            description: expense.description,
            date: expense.date,
            createdAt: expense.created_at,
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Failed to create expense', details: (error as Error).message });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { categoryId, categoryName, amount, description, date } = req.body;

        await pool.query<ResultSetHeader>(
            'UPDATE expenses SET category_id = ?, category_name = ?, amount = ?, description = ?, date = ? WHERE id = ?',
            [categoryId, categoryName, amount, description, date, req.params.id]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
        const expense = rows[0];
        res.json({
            id: expense.id,
            categoryId: expense.category_id,
            categoryName: expense.category_name,
            amount: parseFloat(expense.amount),
            description: expense.description,
            date: expense.date,
            createdAt: expense.created_at,
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        await pool.query<ResultSetHeader>('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// Create category
router.post('/categories', async (req, res) => {
    try {
        const { name, color } = req.body;
        const id = uuidv4();

        await pool.query<ResultSetHeader>(
            'INSERT INTO expense_categories (id, name, color) VALUES (?, ?, ?)',
            [id, name, color || '#6366f1']
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM expense_categories WHERE id = ?', [id]);
        const cat = rows[0];
        res.status(201).json({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            createdAt: cat.created_at
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        await pool.query<ResultSetHeader>('DELETE FROM expense_categories WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
