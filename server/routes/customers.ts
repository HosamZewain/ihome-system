import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import csv from 'csv-parser';

const router = Router();

// Get all customers with their purchase history
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers ORDER BY name');

        const customers = [];
        for (const customer of rows) {
            const [invoices] = await pool.query<RowDataPacket[]>(
                'SELECT COUNT(*) as count, SUM(total) as total FROM invoices WHERE customer_id = ?',
                [customer.id]
            );

            customers.push({
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                customerType: customer.customer_type || 'individual',
                companyName: customer.company_name,
                taxNumber: customer.tax_number,
                details: customer.details,
                invoiceCount: invoices[0]?.count || 0,
                totalSpent: parseFloat(invoices[0]?.total) || 0,
                createdAt: customer.created_at
            });
        }

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// Get single customer with invoices
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = rows[0];

        // Get invoices
        const [invoices] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM invoices WHERE customer_id = ? ORDER BY created_at DESC',
            [req.params.id]
        );

        const mappedCustomer = {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            customerType: customer.customer_type || 'individual',
            companyName: customer.company_name,
            taxNumber: customer.tax_number,
            details: customer.details,
            purchaseHistory: invoices.map(inv => ({
                id: inv.id,
                invoiceNumber: inv.invoice_number,
                total: parseFloat(inv.total),
                status: inv.status,
                createdAt: inv.created_at
            })),
            createdAt: customer.created_at
        };

        res.json(mappedCustomer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// Create customer
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, address, customerType, companyName, taxNumber, details } = req.body;
        const id = uuidv4();

        await pool.query<ResultSetHeader>(
            `INSERT INTO customers (id, name, email, phone, address, customer_type, company_name, tax_number, details) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, name, email || '', phone || '', address || '', customerType || 'individual', companyName || '', taxNumber || '', details || '']
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [id]);
        const c = rows[0];
        res.status(201).json({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            customerType: c.customer_type,
            companyName: c.company_name,
            taxNumber: c.tax_number,
            details: c.details,
            createdAt: c.created_at
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// Update customer
router.put('/:id', async (req, res) => {
    try {
        const { name, email, phone, address, customerType, companyName, taxNumber, details } = req.body;

        await pool.query<ResultSetHeader>(
            `UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, 
             customer_type = ?, company_name = ?, tax_number = ?, details = ? WHERE id = ?`,
            [name, email, phone, address, customerType || 'individual', companyName || '', taxNumber || '', details || '', req.params.id]
        );

        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        const c = rows[0];
        res.json({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            customerType: c.customer_type,
            companyName: c.company_name,
            taxNumber: c.tax_number,
            details: c.details,
            createdAt: c.created_at
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// Delete customer
router.delete('/:id', async (req, res) => {
    try {
        await pool.query<ResultSetHeader>('DELETE FROM customers WHERE id = ?', [req.params.id]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// Import customers CSV
router.post('/import', upload.single('csv'), async (req: any, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const customers: any[] = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => customers.push(data))
        .on('end', async () => {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                for (const customer of customers) {
                    const id = uuidv4();
                    const { name, email, phone, address, customerType, companyName, taxNumber, details } = customer;

                    await connection.query(
                        `INSERT INTO customers (id, name, email, phone, address, customer_type, company_name, tax_number, details) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [id, name, email || '', phone || '', address || '', customerType || 'individual', companyName || '', taxNumber || '', details || '']
                    );
                }

                await connection.commit();
                fs.unlinkSync(req.file.path); // Delete temp file
                res.status(200).json({ message: `Successfully imported ${customers.length} customers` });
            } catch (error) {
                await connection.rollback();
                console.error('Error importing customers:', error);
                res.status(500).json({ error: 'Failed to import customers' });
            } finally {
                connection.release();
            }
        });
});

export default router;
