import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ihome_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

export async function initDatabase() {
  const connection = await pool.getConnection();

  try {
    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
        quantity INT NOT NULL DEFAULT 0,
        image_url VARCHAR(500),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create customers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        customer_type ENUM('individual', 'company') DEFAULT 'individual',
        company_name VARCHAR(255),
        tax_number VARCHAR(100),
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL,
        customer_id VARCHAR(36),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        type ENUM('quotation', 'invoice') NOT NULL,
        status ENUM('draft', 'pending', 'paid', 'cancelled') NOT NULL DEFAULT 'draft',
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create invoice_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id VARCHAR(36) PRIMARY KEY,
        invoice_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36),
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);

    // Create expense_categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#6366f1'
      )
    `);

    // Create expenses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(36) PRIMARY KEY,
        category_id VARCHAR(36),
        category_name VARCHAR(100) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default expense categories if none exist
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM expense_categories');
    if ((categories as any)[0].count === 0) {
      await connection.query(`
        INSERT INTO expense_categories (id, name, color) VALUES
        (UUID(), 'Rent', '#ef4444'),
        (UUID(), 'Utilities', '#f59e0b'),
        (UUID(), 'Supplies', '#22c55e'),
        (UUID(), 'Marketing', '#6366f1'),
        (UUID(), 'Salaries', '#ec4899'),
        (UUID(), 'Other', '#64748b')
      `);
    }

    // Create suppliers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create purchase_invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id VARCHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL,
        supplier_id VARCHAR(36),
        supplier_name VARCHAR(255),
        status ENUM('pending', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create purchase_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS purchase_items (
        id VARCHAR(36) PRIMARY KEY,
        purchase_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36),
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        FOREIGN KEY (purchase_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE
      )
    `);

    // Create roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(36) PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        module VARCHAR(50)
      )
    `);

    // Create role_permissions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(36),
        permission_id VARCHAR(36),
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        role_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `);

    // Seed Admin Role and User
    const [existingRoles]: any = await connection.query('SELECT * FROM roles WHERE name = ?', ['Admin']);
    if (existingRoles.length === 0) {
      await connection.query('INSERT INTO roles (id, name, description) VALUES (UUID(), ?, ?)', ['Admin', 'Full System Access']);

      const [adminRole]: any = await connection.query('SELECT id FROM roles WHERE name = ?', ['Admin']);
      const adminRoleId = adminRole[0].id;

      await connection.query('INSERT INTO users (id, username, password_hash, full_name, role_id) VALUES (UUID(), ?, ?, ?, ?)', [
        'admin',
        '$2b$10$B/TZEd1KXaogc/S3Wf./5.t7muwrXXFjxS1Ghcj7KAND9nIsxqlNi', // admin123
        'System Admin',
        adminRoleId
      ]);
      console.log('✅ Default Admin user created');
    }

    console.log('✅ Database tables initialized');
  } finally {
    connection.release();
  }
}

export default pool;
