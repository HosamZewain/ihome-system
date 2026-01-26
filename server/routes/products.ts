import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import csv from 'csv-parser';

const router = Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products ORDER BY created_at DESC');
        const products = rows.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: parseFloat(p.price),
            costPrice: parseFloat(p.cost),
            quantity: p.quantity,
            imageUrl: p.image_url,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        }));
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const p = rows[0];
        res.json({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: parseFloat(p.price),
            costPrice: parseFloat(p.cost),
            quantity: p.quantity,
            imageUrl: p.image_url,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, sku, category, price, costPrice, quantity, description } = req.body;
        const id = uuidv4();
        const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

        await pool.query<ResultSetHeader>(
            'INSERT INTO products (id, name, sku, category, price, cost, quantity, image_url, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, sku || '', category || '', price || 0, costPrice || 0, quantity || 0, imageUrl, description || '']
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [id]);
        const p = rows[0];
        res.status(201).json({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: parseFloat(p.price),
            costPrice: parseFloat(p.cost),
            quantity: p.quantity,
            imageUrl: p.image_url,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, sku, category, price, costPrice, quantity, description } = req.body;
        let imageUrl = req.body.imageUrl;

        if (req.file) {
            imageUrl = `/uploads/products/${req.file.filename}`;
        }

        await pool.query<ResultSetHeader>(
            'UPDATE products SET name = ?, sku = ?, category = ?, price = ?, cost = ?, quantity = ?, image_url = ?, description = ? WHERE id = ?',
            [name, sku, category, price, costPrice, quantity, imageUrl, description, req.params.id]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [req.params.id]);
        const p = rows[0];
        res.json({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: parseFloat(p.price),
            costPrice: parseFloat(p.cost),
            quantity: p.quantity,
            imageUrl: p.image_url,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Update stock only
router.patch('/:id/stock', async (req, res) => {
    try {
        const { quantity } = req.body;

        await pool.query<ResultSetHeader>(
            'UPDATE products SET quantity = ? WHERE id = ?',
            [quantity, req.params.id]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM products WHERE id = ?', [req.params.id]);
        const p = rows[0];
        res.json({
            id: p.id,
            name: p.name,
            sku: p.sku,
            category: p.category,
            price: parseFloat(p.price),
            costPrice: parseFloat(p.cost),
            quantity: p.quantity,
            imageUrl: p.image_url,
            description: p.description,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Import products CSV
router.post('/import', upload.single('csv'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const products: any[] = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => products.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                for (const product of products) {
                    const id = uuidv4();
                    const { name, sku, category, price, costPrice, quantity, description } = product;

                    await connection.query(
                        'INSERT INTO products (id, name, sku, category, price, cost, quantity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                        [id, name, sku || '', category || '', price || 0, costPrice || 0, quantity || 0, description || '']
                    );
                }

                await connection.commit();
                fs.unlinkSync(req.file.path); // Delete temp file
                res.status(200).json({ message: `Successfully imported ${products.length} products` });
            } catch (error) {
                await connection.rollback();
                console.error('Error importing products:', error);
                res.status(500).json({ error: 'Failed to import products' });
            } finally {
                connection.release();
            }
        });
});

export default router;
