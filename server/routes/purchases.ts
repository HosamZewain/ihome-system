import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import csv from 'csv-parser';

const router = Router();

// Get all purchase invoices
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM purchase_invoices ORDER BY created_at DESC'
        );

        const purchases = [];
        for (const purchase of rows) {
            const [items] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM purchase_items WHERE purchase_id = ?',
                [purchase.id]
            );
            purchases.push({
                id: purchase.id,
                invoiceNumber: purchase.invoice_number,
                supplierId: purchase.supplier_id,
                supplierName: purchase.supplier_name,
                supplier: {
                    id: purchase.supplier_id,
                    name: purchase.supplier_name,
                },
                items: items.map((item: any) => ({
                    productId: item.product_id,
                    productName: item.product_name,
                    quantity: item.quantity,
                    unitCost: parseFloat(item.unit_cost),
                    total: parseFloat(item.total),
                })),
                status: purchase.status,
                subtotal: parseFloat(purchase.subtotal),
                total: parseFloat(purchase.total),
                notes: purchase.notes,
                createdAt: purchase.created_at,
                updatedAt: purchase.updated_at
            });
        }

        res.json(purchases);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

// Create purchase invoice and update stock
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let { invoiceNumber, supplier, status, subtotal, total, notes, items } = req.body;

        if (!invoiceNumber) {
            invoiceNumber = `PUR-${Date.now()}`;
        }

        if (!items || !Array.isArray(items)) {
            items = [];
        }

        const id = uuidv4();

        // Create purchase invoice
        await connection.query<ResultSetHeader>(
            `INSERT INTO purchase_invoices (id, invoice_number, supplier_id, supplier_name, status, subtotal, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, invoiceNumber, supplier?.id || null, supplier?.name || '', status || 'pending', subtotal || 0, total || 0, notes || '']
        );

        // Insert items and update product stock
        for (const item of items || []) {
            const itemName = item.productName || item.name || 'Unknown Product';
            const itemQty = item.quantity || 1;
            const itemCost = item.unitCost || 0;
            const itemTotal = item.total || (itemQty * itemCost);

            await connection.query<ResultSetHeader>(
                `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_cost, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), id, item.productId || null, itemName, itemQty, itemCost, itemTotal]
            );

            // Update product stock - INCREASE quantity
            if (item.productId) {
                await connection.query<ResultSetHeader>(
                    'UPDATE products SET quantity = quantity + ?, cost = ? WHERE id = ?',
                    [itemQty, itemCost, item.productId]
                );
            }
        }

        await connection.commit();

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM purchase_invoices WHERE id = ?', [id]);
        const p = rows[0];

        res.status(201).json({
            id: p.id,
            invoiceNumber: p.invoice_number,
            supplierId: p.supplier_id,
            supplierName: p.supplier_name,
            supplier: supplier,
            items: items,
            status: p.status,
            subtotal: parseFloat(p.subtotal),
            total: parseFloat(p.total),
            notes: p.notes,
            createdAt: p.created_at,
            updatedAt: p.updated_at
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: 'Failed to create purchase', details: (error as Error).message });
    } finally {
        connection.release();
    }
});

// Delete purchase (does not reverse stock changes)
router.delete('/:id', async (req, res) => {
    try {
        await pool.query<ResultSetHeader>('DELETE FROM purchase_invoices WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting purchase:', error);
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
});

// Import purchases CSV
// Format: invoiceNumber, supplierName, status, notes, productName, productId, quantity, unitCost
router.post('/import', upload.single('csv'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const rows: any[] = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                // Group items by invoiceNumber
                const invoicesMap = new Map<string, any>();
                for (const row of rows) {
                    const invNum = row.invoiceNumber || `PUR-IMP-${Date.now()}`;
                    if (!invoicesMap.has(invNum)) {
                        invoicesMap.set(invNum, {
                            id: uuidv4(),
                            invoiceNumber: invNum,
                            supplierName: row.supplierName || 'Imported Supplier',
                            status: row.status || 'received',
                            notes: row.notes || 'Imported via CSV',
                            items: []
                        });
                    }
                    invoicesMap.get(invNum).items.push(row);
                }

                for (const inv of invoicesMap.values()) {
                    let subtotal = 0;
                    let total = 0;

                    // Calculate totals from items
                    for (const item of inv.items) {
                        const qty = parseInt(item.quantity) || 0;
                        const cost = parseFloat(item.unitCost) || 0;
                        subtotal += qty * cost;
                    }
                    total = subtotal;

                    await connection.query(
                        `INSERT INTO purchase_invoices (id, invoice_number, supplier_name, status, subtotal, total, notes)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [inv.id, inv.invoiceNumber, inv.supplierName, inv.status, subtotal, total, inv.notes]
                    );

                    for (const item of inv.items) {
                        const qty = parseInt(item.quantity) || 0;
                        const cost = parseFloat(item.unitCost) || 0;
                        const itemTotal = qty * cost;

                        await connection.query(
                            `INSERT INTO purchase_items (id, purchase_id, product_id, product_name, quantity, unit_cost, total)
                             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [uuidv4(), inv.id, item.productId || null, item.productName || 'Unknown Product', qty, cost, itemTotal]
                        );

                        // Update stock
                        if (item.productId) {
                            await connection.query(
                                'UPDATE products SET quantity = quantity + ?, cost = ? WHERE id = ?',
                                [qty, cost, item.productId]
                            );
                        }
                    }
                }

                await connection.commit();
                fs.unlinkSync(req.file.path);
                res.status(200).json({ message: `Successfully imported ${invoicesMap.size} invoices` });
            } catch (error) {
                await connection.rollback();
                console.error('Error importing purchases:', error);
                res.status(500).json({ error: 'Failed to import purchases' });
            } finally {
                connection.release();
            }
        });
});

export default router;
