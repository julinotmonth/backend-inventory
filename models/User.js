const { getDatabase, saveDatabase } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  // Get all users
  static getAll({ is_active = 1 } = {}) {
    const db = getDatabase();
    const query = `
      SELECT id, name, email, role, avatar_url, is_active, created_at, updated_at
      FROM users
      WHERE is_active = ?
      ORDER BY name ASC
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

  // Get user by ID
  static getById(id) {
    const db = getDatabase();
    const query = `
      SELECT id, name, email, role, avatar_url, is_active, created_at, updated_at
      FROM users WHERE id = ?
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

  // Get user by email (with password for auth)
  static getByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    stmt.bind([email]);
    
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    
    return result;
  }

  // Create user
  static create(data) {
    const db = getDatabase();
    const id = data.id || `user_${uuidv4().split('-')[0]}`;
    const now = new Date().toISOString();
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const query = `
      INSERT INTO users (id, name, email, password, role, avatar_url, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(query, [
      id,
      data.name,
      data.email,
      hashedPassword,
      data.role || 'staff',
      data.avatar_url || null,
      data.is_active !== undefined ? data.is_active : 1,
      now,
      now
    ]);

    saveDatabase();
    return this.getById(id);
  }

  // Update user
  static update(id, data) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const fields = [];
    const values = [];

    const allowedFields = ['name', 'email', 'role', 'avatar_url', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    // Handle password separately
    if (data.password) {
      fields.push('password = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }

    if (fields.length === 0) return this.getById(id);

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);
    
    saveDatabase();
    return this.getById(id);
  }

  // Verify password
  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  // Delete user (soft delete)
  static delete(id) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.run('UPDATE users SET is_active = 0, updated_at = ? WHERE id = ?', [now, id]);
    saveDatabase();
    return { success: true };
  }
}

module.exports = User;
