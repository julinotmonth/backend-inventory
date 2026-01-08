const { getDatabase, saveDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Supplier {
  // Get all suppliers
  static getAll({ is_active = 1 } = {}) {
    const db = getDatabase();
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id AND p.is_active = 1) as product_count
      FROM suppliers s
      WHERE s.is_active = ?
      ORDER BY s.name ASC
    `;
    const stmt = db.prepare(query);
    stmt.bind([is_active]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    
    return results;
  }

  // Get supplier by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id AND p.is_active = 1) as product_count
      FROM suppliers s
      WHERE s.id = ?
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

  // Create supplier
  static create(data) {
    const db = getDatabase();
    const id = data.id || `sup_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO suppliers (
        id, name, email, phone, address, contact_person, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      id,
      data.name,
      data.email || null,
      data.phone || null,
      data.address || null,
      data.contact_person || null,
      data.notes || null,
      data.is_active !== undefined ? data.is_active : 1,
      now,
      now
    ]);

    saveDatabase();
    return this.getById(id);
  }

  // Update supplier
  static update(id, data) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'email', 'phone', 'address', 'contact_person', 'notes', 'is_active'];

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

    const query = `UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);
    
    saveDatabase();
    return this.getById(id);
  }

  // Delete supplier (soft delete)
  static delete(id) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.run('UPDATE suppliers SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
    saveDatabase();
    return { success: true };
  }
}

module.exports = Supplier;
