const { getDatabase } = require('../config/database');

class Transaction {
  // Get all transactions
  static getAll({ product_id, type, limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT 
        t.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (product_id) {
      query += ` AND t.product_id = ?`;
      params.push(product_id);
    }

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
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

  // Get transaction by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT 
        t.*,
        p.name as product_name,
        p.sku as product_sku,
        u.name as user_name
      FROM stock_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
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

  // Get transactions by product
  static getByProduct(productId, { limit = 50 } = {}) {
    const db = getDatabase();
    const query = `
      SELECT * FROM stock_transactions
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    const stmt = db.prepare(query);
    stmt.bind([productId, limit]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get recent transactions
  static getRecent(limit = 10) {
    const db = getDatabase();
    const query = `
      SELECT 
        t.*,
        p.name as product_name,
        p.sku as product_sku
      FROM stock_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `;
    const stmt = db.prepare(query);
    stmt.bind([limit]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get transactions by date range
  static getByDateRange(startDate, endDate) {
    const db = getDatabase();
    const query = `
      SELECT 
        t.*,
        p.name as product_name
      FROM stock_transactions t
      LEFT JOIN products p ON t.product_id = p.id
      WHERE t.created_at BETWEEN ? AND ?
      ORDER BY t.created_at DESC
    `;
    const stmt = db.prepare(query);
    stmt.bind([startDate, endDate]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get transaction summary by type
  static getSummaryByType(startDate, endDate) {
    const db = getDatabase();
    const query = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity,
        SUM(total_amount) as total_amount
      FROM stock_transactions
      WHERE created_at BETWEEN ? AND ?
      GROUP BY type
    `;
    const stmt = db.prepare(query);
    stmt.bind([startDate, endDate]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }
}

module.exports = Transaction;