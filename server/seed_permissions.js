import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const permissions = [
  { code: 'dashboard.view', desc: 'View Dashboard', module: 'dashboard' },
  { code: 'products.view', desc: 'View Products', module: 'products' },
  { code: 'products.create', desc: 'Add Products', module: 'products' },
  { code: 'products.edit', desc: 'Edit Products', module: 'products' },
  { code: 'products.delete', desc: 'Delete Products', module: 'products' },
  { code: 'customers.view', desc: 'View Customers', module: 'customers' },
  { code: 'customers.create', desc: 'Add Customers', module: 'customers' },
  { code: 'customers.edit', desc: 'Edit Customers', module: 'customers' },
  { code: 'customers.delete', desc: 'Delete Customers', module: 'customers' },
  { code: 'sales.view', desc: 'View Sales', module: 'sales' },
  { code: 'sales.create', desc: 'Create Invoice/Quote', module: 'sales' },
  { code: 'sales.edit', desc: 'Edit Invoice/Quote', module: 'sales' },
  { code: 'sales.delete', desc: 'Delete Invoice/Quote', module: 'sales' },
  { code: 'purchases.view', desc: 'View Purchases', module: 'purchases' },
  { code: 'purchases.create', desc: 'Create Purchase', module: 'purchases' },
  { code: 'purchases.edit', desc: 'Edit Purchase', module: 'purchases' },
  { code: 'purchases.delete', desc: 'Delete Purchase', module: 'purchases' },
  { code: 'users.view', desc: 'View Users', module: 'admin' },
  { code: 'users.create', desc: 'Add Users', module: 'admin' },
  { code: 'users.edit', desc: 'Edit Users', module: 'admin' },
  { code: 'users.delete', desc: 'Delete Users', module: 'admin' },
  { code: 'roles.view', desc: 'View Roles', module: 'admin' },
  { code: 'roles.create', desc: 'Add Roles', module: 'admin' },
  { code: 'roles.edit', desc: 'Edit Roles', module: 'admin' },
  { code: 'roles.delete', desc: 'Delete Roles', module: 'admin' },
];

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  for (const p of permissions) {
    try {
      await pool.query('INSERT IGNORE INTO permissions (id, code, description, module) VALUES (UUID(), ?, ?, ?)', [p.code, p.desc, p.module]);
    } catch (err) {
      console.error(err);
    }
  }
  console.log('Permissions seeded');
  process.exit(0);
}

seed();
