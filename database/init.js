const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Create database
const dbPath = path.join(__dirname, 'inventory.db');
const db = new Database(dbPath);

console.log('🔧 Initializing database...');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// =============================================
// CREATE TABLES
// =============================================

// Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'staff', 'viewer')),
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Categories Table
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color_hex TEXT,
    parent_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
  )
`);

// Suppliers Table
db.exec(`
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    contact_person TEXT,
    notes TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Products Table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    category_id TEXT,
    supplier_id TEXT,
    price REAL NOT NULL DEFAULT 0,
    cost_price REAL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'unit',
    location TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
  )
`);

// Stock Transactions Table
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('stock_in', 'stock_out', 'adjustment', 'transfer', 'sale', 'purchase', 'return')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_price REAL,
    total_amount REAL,
    reference_no TEXT,
    notes TEXT,
    user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )
`);

// Create indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_product ON stock_transactions(product_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_type ON stock_transactions(type);
  CREATE INDEX IF NOT EXISTS idx_transactions_date ON stock_transactions(created_at);
`);

console.log('✅ Tables created successfully');

// =============================================
// INSERT DEFAULT DATA
// =============================================

// Check if categories exist
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();

if (categoryCount.count === 0) {
  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, description, icon_name, color_hex)
    VALUES (?, ?, ?, ?, ?)
  `);

  const defaultCategories = [
    ['cat_1', 'Electronics', 'Electronic devices and accessories', 'device_mobile', '#3B82F6'],
    ['cat_2', 'Clothing', 'Apparel and fashion items', 'shirt', '#8B5CF6'],
    ['cat_3', 'Food & Beverages', 'Food products and drinks', 'coffee', '#F59E0B'],
    ['cat_4', 'Office Supplies', 'Stationery and office equipment', 'briefcase', '#10B981'],
    ['cat_5', 'Other', 'Miscellaneous items', 'box', '#6B7280'],
  ];

  const insertMany = db.transaction((categories) => {
    for (const cat of categories) {
      insertCategory.run(...cat);
    }
  });

  insertMany(defaultCategories);
  console.log('✅ Default categories inserted');
}

// Check if admin user exists
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.prepare(`
    INSERT INTO users (id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
  `).run('user_admin', 'Administrator', 'admin@inventory.com', hashedPassword, 'admin');
  
  console.log('✅ Default admin user created');
  console.log('   Email: admin@inventory.com');
  console.log('   Password: admin123');
}

// Insert sample products
const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, sku, category_id, price, cost_price, quantity, min_stock, unit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleProducts = [
    ['prod_1', 'iPhone 15 Pro', 'Latest Apple smartphone', 'SKU-001', 'cat_1', 19999000, 18000000, 25, 5, 'unit'],
    ['prod_2', 'Samsung Galaxy S24', 'Samsung flagship phone', 'SKU-002', 'cat_1', 15999000, 14000000, 30, 5, 'unit'],
    ['prod_3', 'Kaos Polos Hitam', 'Kaos cotton combed 30s', 'SKU-003', 'cat_2', 75000, 45000, 100, 20, 'pcs'],
    ['prod_4', 'Kemeja Formal Putih', 'Kemeja kerja pria', 'SKU-004', 'cat_2', 250000, 150000, 50, 10, 'pcs'],
    ['prod_5', 'Kopi Arabica 250gr', 'Kopi arabica premium', 'SKU-005', 'cat_3', 85000, 50000, 200, 30, 'pack'],
    ['prod_6', 'Teh Celup Box', 'Teh celup isi 25', 'SKU-006', 'cat_3', 15000, 8000, 150, 25, 'box'],
    ['prod_7', 'Pulpen Pilot', 'Pulpen hitam 0.5mm', 'SKU-007', 'cat_4', 12000, 7000, 500, 100, 'pcs'],
    ['prod_8', 'Buku Tulis A5', 'Buku tulis 100 lembar', 'SKU-008', 'cat_4', 8000, 4500, 300, 50, 'pcs'],
  ];

  const insertManyProducts = db.transaction((products) => {
    for (const prod of products) {
      insertProduct.run(...prod);
    }
  });

  insertManyProducts(sampleProducts);
  console.log('✅ Sample products inserted');
}

console.log('');
console.log('🎉 Database initialization complete!');
console.log('📁 Database file:', dbPath);

db.close();
