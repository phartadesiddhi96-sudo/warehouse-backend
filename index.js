const path = require("path");
const Database = require("better-sqlite3");

// Single SQLite file on disk — no separate database server to install or run.
// Good for local use and small deployments; swap for Postgres/MySQL later
// if you need a database that survives redeploys on ephemeral hosting.
const dbPath = path.join(__dirname, "..", "warehouse.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL,
    price REAL NOT NULL,
    supplier TEXT NOT NULL,
    location TEXT NOT NULL,
    low_stock_limit REAL NOT NULL DEFAULT 5,
    date_stored TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by INTEGER REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

module.exports = db;
