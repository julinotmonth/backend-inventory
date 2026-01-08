const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
const dbPath = path.join(__dirname, '..', 'database', 'inventory.db');

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  
  // Create database directory if not exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('✅ Database loaded from:', dbPath);
  } else {
    db = new SQL.Database();
    console.log('✅ New database created');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  return db;
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Get database instance
function getDatabase() {
  return db;
}

// Auto-save every 30 seconds
setInterval(() => {
  saveDatabase();
}, 30000);

// Save on process exit
process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit();
});
process.on('SIGTERM', () => {
  saveDatabase();
  process.exit();
});

module.exports = { initDatabase, getDatabase, saveDatabase };
