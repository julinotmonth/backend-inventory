const { getDatabase, saveDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const Product = require('./Product');

class Return {
  // Get all returns
  static getAll({ type, status, product_id, limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    let query = `
      SELECT 
        r.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image,
        s.name as supplier_name
      FROM returns r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ` AND r.type = ?`;
      params.push(type);
    }

    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (product_id) {
      query += ` AND r.product_id = ?`;
      params.push(product_id);
    }

    query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
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

  // Get return by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT 
        r.*,
        p.name as product_name,
        p.sku as product_sku,
        p.image_url as product_image,
        s.name as supplier_name,
        u.name as processed_by_name
      FROM returns r
      LEFT JOIN products p ON r.product_id = p.id
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN users u ON r.processed_by = u.id
      WHERE r.id = ?
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

  // Create return
  static create(data) {
    const db = getDatabase();
    const id = data.id || `ret_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    // Validate product exists
    const product = Product.getById(data.product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    // For customer returns (return_in), check if we're adding stock back
    // For supplier returns (return_out), check if we have enough stock
    if (data.type === 'return_out' && product.quantity < data.quantity) {
      throw new Error('Insufficient stock for return to supplier');
    }

    const query = `
      INSERT INTO returns (
        id, product_id, type, quantity, reason, status,
        customer_name, customer_contact, supplier_id,
        original_transaction_id, refund_amount, notes,
        processed_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      id,
      data.product_id,
      data.type || 'return_in', // return_in (from customer) or return_out (to supplier)
      data.quantity || 1,
      data.reason || null,
      data.status || 'pending', // pending, approved, rejected, completed
      data.customer_name || null,
      data.customer_contact || null,
      data.supplier_id || null,
      data.original_transaction_id || null,
      data.refund_amount || null,
      data.notes || null,
      data.processed_by || null,
      now,
      now
    ]);

    saveDatabase();
    return this.getById(id);
  }

  // Update return
  static update(id, data) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    const allowedFields = [
      'quantity', 'reason', 'status', 'customer_name', 'customer_contact',
      'supplier_id', 'refund_amount', 'notes', 'processed_by'
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

    const query = `UPDATE returns SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);
    
    saveDatabase();
    return this.getById(id);
  }

  // Process return (approve/reject and update stock)
  static process(id, { status, processed_by = null, notes = null }) {
    const returnData = this.getById(id);
    if (!returnData) {
      throw new Error('Return not found');
    }

    if (returnData.status === 'completed') {
      throw new Error('Return already completed');
    }

    if (returnData.status === 'rejected') {
      throw new Error('Cannot process rejected return');
    }

    const db = getDatabase();
    const now = new Date().toISOString();

    // Only update stock when completing the return (not when just approving)
    if (status === 'completed') {
      // Update stock based on return type
      const quantityChange = returnData.type === 'return_in' 
        ? returnData.quantity  // Add stock for customer return
        : -returnData.quantity; // Remove stock for supplier return

      // Update product stock
      Product.updateStock(
        returnData.product_id,
        quantityChange,
        returnData.type === 'return_in' ? 'return_in' : 'return_out',
        {
          reference_no: `RET-${id}`,
          notes: `Return ${returnData.type === 'return_in' ? 'from customer' : 'to supplier'}: ${notes || returnData.reason || 'No reason provided'}`,
          user_id: processed_by
        }
      );
    }

    // Update return status - use parameterized query properly
    const updateQuery = `
      UPDATE returns 
      SET status = ?, processed_by = ?, updated_at = ?
      WHERE id = ?
    `;
    db.run(updateQuery, [status, processed_by, now, id]);

    // Update notes separately if provided
    if (notes) {
      db.run('UPDATE returns SET notes = ? WHERE id = ?', [notes, id]);
    }

    saveDatabase();
    return this.getById(id);
  }

  // Delete return (only pending returns)
  static delete(id) {
    const returnData = this.getById(id);
    if (!returnData) {
      throw new Error('Return not found');
    }

    if (returnData.status !== 'pending') {
      throw new Error('Can only delete pending returns');
    }

    const db = getDatabase();
    db.run('DELETE FROM returns WHERE id = ?', [id]);
    saveDatabase();
    return { success: true };
  }

  // Get return statistics
  static getStats(startDate, endDate) {
    const db = getDatabase();
    let query = `
      SELECT 
        type,
        status,
        COUNT(*) as count,
        SUM(quantity) as total_quantity,
        SUM(refund_amount) as total_refund
      FROM returns
      WHERE 1=1
    `;
    const params = [];

    if (startDate && endDate) {
      query += ` AND created_at BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY type, status`;

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

  // Get returns by product
  static getByProduct(productId, { limit = 50 } = {}) {
    const db = getDatabase();
    const query = `
      SELECT * FROM returns
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

  // Get recent returns
  static getRecent(limit = 10) {
    const db = getDatabase();
    const query = `
      SELECT 
        r.*,
        p.name as product_name,
        p.sku as product_sku
      FROM returns r
      LEFT JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
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
}

module.exports = Return;