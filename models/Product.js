const { getDatabase, saveDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  // Get all products
  static getAll({ search, category_id, user_id, is_active = 1, limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.color_hex as category_color,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = ?
    `;
    const params = [is_active];

    // Filter by user_id if provided
    if (user_id) {
      query += ` AND p.user_id = ?`;
      params.push(user_id);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category_id) {
      query += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    query += ` ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(query);
    stmt.bind(params);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get product by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        c.color_hex as category_color,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `;
    const stmt = db.prepare(query);
    stmt.bind([id]);
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    return result;
  }

  // Get product by barcode
  static getByBarcode(barcode) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM products WHERE barcode = ?');
    stmt.bind([barcode]);
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    return result;
  }

  // Create product
  static create(data) {
    const db = getDatabase();
    const id = data.id || `prod_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO products (
        id, name, description, sku, barcode, category_id, supplier_id, user_id,
        price, cost_price, quantity, min_stock, unit, location, image_url,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      id,
      data.name,
      data.description || null,
      data.sku || null,
      data.barcode || null,
      data.category_id || null,
      data.supplier_id || null,
      data.user_id || null,
      data.price || 0,
      data.cost_price || null,
      data.quantity || 0,
      data.min_stock || 0,
      data.unit || 'unit',
      data.location || null,
      data.image_url || null,
      data.is_active !== undefined ? data.is_active : 1,
      now,
      now
    ]);

    saveDatabase();
    return this.getById(id);
  }

  // Update product
  static update(id, data) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    const allowedFields = [
      'name', 'description', 'sku', 'barcode', 'category_id', 'supplier_id',
      'price', 'cost_price', 'quantity', 'min_stock', 'unit', 'location',
      'image_url', 'is_active'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);
    
    saveDatabase();
    return this.getById(id);
  }

  // Delete product (soft delete)
  static delete(id) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.run('UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
    saveDatabase();
    return { success: true };
  }

  // Update stock
  static updateStock(id, quantityChange, type, options = {}) {
    const product = this.getById(id);
    if (!product) return null;

    const db = getDatabase();
    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + quantityChange;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    const now = new Date().toISOString();

    // Update product quantity
    db.run('UPDATE products SET quantity = ?, updated_at = ? WHERE id = ?', [newQuantity, now, id]);

    // Create transaction record
    const transactionId = `txn_${uuidv4().split('-')[0]}`;
    const absQuantity = Math.abs(quantityChange);
    const unitPrice = options.unit_price || product.price;
    const totalAmount = unitPrice * absQuantity;

    db.run(`
      INSERT INTO stock_transactions (
        id, product_id, type, quantity, previous_quantity, new_quantity,
        unit_price, total_amount, reference_no, notes, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionId,
      id,
      type,
      absQuantity,
      previousQuantity,
      newQuantity,
      unitPrice,
      totalAmount,
      options.reference_no || null,
      options.notes || null,
      options.user_id || null,
      now
    ]);

    saveDatabase();

    return {
      product: this.getById(id),
      transaction: {
        id: transactionId,
        product_id: id,
        type,
        quantity: absQuantity,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        created_at: now
      }
    };
  }

  // Get low stock products
  static getLowStock(user_id = null) {
    const db = getDatabase();
    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 
      AND p.quantity <= p.min_stock 
      AND p.min_stock > 0
    `;
    const params = [];
    
    if (user_id) {
      query += ` AND p.user_id = ?`;
      params.push(user_id);
    }
    
    query += ` ORDER BY p.quantity ASC`;
    
    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get out of stock products
  static getOutOfStock(user_id = null) {
    const db = getDatabase();
    let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.quantity <= 0
    `;
    const params = [];
    
    if (user_id) {
      query += ` AND p.user_id = ?`;
      params.push(user_id);
    }
    
    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get inventory statistics
  static getStats(user_id = null) {
    const db = getDatabase();
    let query = `
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(price * quantity), 0) as total_value,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(CASE WHEN quantity > 0 AND quantity <= min_stock AND min_stock > 0 THEN 1 ELSE 0 END) as low_stock_count
      FROM products
      WHERE is_active = 1
    `;
    const params = [];
    
    if (user_id) {
      query += ` AND user_id = ?`;
      params.push(user_id);
    }
    
    const stmt = db.prepare(query);
    if (params.length > 0) {
      stmt.bind(params);
    }
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    return result;
  }
}

module.exports = Product;