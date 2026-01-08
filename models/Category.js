const { getDatabase, saveDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Category {
  // Get all categories
  static getAll({ is_active = 1 } = {}) {
    const db = getDatabase();
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
      FROM categories c
      WHERE c.is_active = ?
      ORDER BY c.name ASC
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

  // Get category by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
      FROM categories c
      WHERE c.id = ?
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

  // Create category
  static create(data) {
    const db = getDatabase();
    const id = data.id || `cat_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO categories (
        id, name, description, icon_name, color_hex, parent_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      id,
      data.name,
      data.description || null,
      data.icon_name || 'box',
      data.color_hex || '#6B7280',
      data.parent_id || null,
      data.is_active !== undefined ? data.is_active : 1,
      now,
      now
    ]);

    saveDatabase();
    return this.getById(id);
  }

  // Update category
  static update(id, data) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'description', 'icon_name', 'color_hex', 'parent_id', 'is_active'];

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

    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);
    
    saveDatabase();
    return this.getById(id);
  }

  // Delete category (soft delete)
  static delete(id) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.run('UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
    saveDatabase();
    return { success: true };
  }
}

module.exports = Category;
