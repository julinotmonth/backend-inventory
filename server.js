const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { initDatabase, getDatabase, saveDatabase } = require('./config/database');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    const db = getDatabase();

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        avatar_url TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_name TEXT,
        color_hex TEXT,
        parent_id TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
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

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT,
        barcode TEXT,
        category_id TEXT,
        supplier_id TEXT,
        user_id TEXT,
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
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Add user_id column if not exists (for existing databases)
    try {
      db.run(`ALTER TABLE products ADD COLUMN user_id TEXT`);
    } catch (e) {
      // Column already exists
    }

    db.run(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        previous_quantity INTEGER NOT NULL,
        new_quantity INTEGER NOT NULL,
        unit_price REAL,
        total_amount REAL,
        reference_no TEXT,
        notes TEXT,
        user_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS returns (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'return_in',
        quantity INTEGER NOT NULL DEFAULT 1,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        customer_name TEXT,
        customer_contact TEXT,
        supplier_id TEXT,
        original_transaction_id TEXT,
        refund_amount REAL,
        notes TEXT,
        processed_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (processed_by) REFERENCES users(id)
      )
    `);

    // Insert default categories if empty
    const catStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
    catStmt.step();
    const catCount = catStmt.getAsObject();
    catStmt.free();

    if (catCount.count === 0) {
      const defaultCategories = [
        ['cat_1', 'Electronics', 'Electronic devices and accessories', 'device_mobile', '#3B82F6'],
        ['cat_2', 'Clothing', 'Apparel and fashion items', 'shirt', '#8B5CF6'],
        ['cat_3', 'Food & Beverages', 'Food products and drinks', 'coffee', '#F59E0B'],
        ['cat_4', 'Office Supplies', 'Stationery and office equipment', 'briefcase', '#10B981'],
        ['cat_5', 'Other', 'Miscellaneous items', 'box', '#6B7280'],
      ];

      for (const cat of defaultCategories) {
        db.run(`INSERT INTO categories (id, name, description, icon_name, color_hex) VALUES (?, ?, ?, ?, ?)`, cat);
      }
      console.log('✅ Default categories created');
    }

    // Insert default admin if empty
    const userStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    userStmt.step();
    const userCount = userStmt.getAsObject();
    userStmt.free();

    if (userCount.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        ['user_admin', 'Administrator', 'admin@inventory.com', hashedPassword, 'admin']);
      console.log('✅ Default admin created (admin@inventory.com / admin123)');
    }

    // Save initial database
    saveDatabase();

    // API Routes
    const routes = require('./routes');
    app.use('/api/v1', routes);

    // Root route
    app.get('/', (req, res) => {
      res.json({
        name: 'Inventory API',
        version: '1.0.0',
        description: 'REST API for Inventory Management App',
        endpoints: {
          auth: '/api/v1/auth',
          products: '/api/v1/products',
          categories: '/api/v1/categories',
          suppliers: '/api/v1/suppliers',
          transactions: '/api/v1/transactions',
          returns: '/api/v1/returns',
          health: '/api/v1/health'
        }
      });
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found'
      });
    });

    // Error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
      });
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║         INVENTORY API SERVER               ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║  🚀 Server running on port ${PORT}             ║`);
      console.log(`║  📁 Database: SQLite (sql.js)              ║`);
      console.log(`║  🌐 URL: http://localhost:${PORT}             ║`);
      console.log('╠════════════════════════════════════════════╣');
      console.log('║  API Endpoints:                            ║');
      console.log(`║  • GET  /api/v1/products                   ║`);
      console.log(`║  • GET  /api/v1/categories                 ║`);
      console.log(`║  • GET  /api/v1/suppliers                  ║`);
      console.log(`║  • GET  /api/v1/transactions               ║`);
      console.log(`║  • POST /api/v1/auth/login                 ║`);
      console.log('╚════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;