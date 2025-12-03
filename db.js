const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'twext.db');

// Initialize database
function initDb() {
  const db = new Database(DB_PATH);
  
  // Create table if it doesn't exist
  db. exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY,
      entry_id TEXT UNIQUE NOT NULL,
      text TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_url ON entries(url);
    CREATE INDEX IF NOT EXISTS idx_created_at ON entries(created_at);
  `);
  
  return db;
}

// Get database connection
function getDb() {
  return new Database(DB_PATH);
}

// Import entries from JSON
function importEntries(db, entries) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO entries (entry_id, text, url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((data) => {
    let count = 0;
    for (const item of data) {
      insert.run(item.entry_id, item. text, item.url, item. created_at, item.updated_at);
      count++;
    }
    return count;
  });
  
  return insertMany(entries);
}

// List all entries
function listAll(db, limit = 50, offset = 0) {
  const stmt = db.prepare(`
    SELECT id, entry_id, text, url, created_at FROM entries
    ORDER BY created_at DESC
    LIMIT ?  OFFSET ?
  `);
  return stmt.all(limit, offset);
}

// Search by text
function searchText(db, query, limit = 50) {
  const stmt = db.prepare(`
    SELECT id, entry_id, text, url, created_at FROM entries
    WHERE text LIKE ? 
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(`%${query}%`, limit);
}

// Get by URL
function getByUrl(db, url) {
  const stmt = db.prepare(`
    SELECT id, entry_id, text, url, created_at FROM entries
    WHERE url = ?
  `);
  return stmt.get(url);
}

// Get count
function getCount(db) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM entries');
  return stmt.get().count;
}

// Export all entries
function exportAll(db) {
  const stmt = db.prepare('SELECT entry_id, text, url, created_at FROM entries ORDER BY created_at DESC');
  return stmt.all();
}

module.exports = {
  initDb,
  getDb,
  importEntries,
  listAll,
  searchText,
  getByUrl,
  getCount,
  exportAll
};