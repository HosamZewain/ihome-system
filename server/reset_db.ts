import pool from './db.js';

async function resetDatabase() {
    const connection = await pool.getConnection();

    try {
        console.log('Resetting database...');

        // Disable foreign key checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Truncate tables
        const tables = [
            'purchase_items',
            'purchase_invoices',
            'invoice_items',
            'invoices'
        ];

        for (const table of tables) {
            await connection.query(`TRUNCATE TABLE ${table}`);
            console.log(`Truncated ${table}`);
        }

        // Reset product stock
        await connection.query('UPDATE products SET quantity = 0');
        console.log('Reset product quantity to 0');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Database reset complete.');

    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        connection.release();
        pool.end();
    }
}

resetDatabase();
