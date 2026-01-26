import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Migrating Customers...');
    try {
        await connection.query("ALTER TABLE customers ADD COLUMN type VARCHAR(50) DEFAULT 'individual'");
        await connection.query("ALTER TABLE customers ADD COLUMN details TEXT");
    } catch (e) { console.log('Columns might already exist in customers'); }

    console.log('Migrating Invoices...');
    try {
        await connection.query("ALTER TABLE invoices ADD COLUMN discount_type ENUM('percentage', 'fixed') DEFAULT 'fixed'");
        await connection.query("ALTER TABLE invoices ADD COLUMN discount_value DECIMAL(10, 2) DEFAULT 0");
    } catch (e) { console.log('Columns might already exist in invoices'); }

    console.log('Migrating Invoice Items...');
    try {
        await connection.query("ALTER TABLE invoice_items ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0");
    } catch (e) { console.log('Columns might already exist in invoice_items'); }
    
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  } finally {
    connection.end();
  }
}

migrate();
