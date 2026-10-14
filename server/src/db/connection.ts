// connection.ts — SQLite database singleton using Node.js built-in node:sqlite.
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { runSeed } from './seed';

// Use dynamic require so Vite / bundlers do not intercept node:sqlite
const nodeRequire = createRequire(__filename);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync } = nodeRequire('node:sqlite');

export interface DatabaseWithTransaction {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...args: unknown[]) => unknown[];
    get: (...args: unknown[]) => unknown;
    run: (...args: unknown[]) => { lastInsertRowid: number | bigint; changes: number | bigint };
  };
  transaction: <T, Args extends unknown[]>(fn: (...args: Args) => T) => (...args: Args) => T;
}

let dbInstance: DatabaseWithTransaction | null = null;

function initializeDatabase(db: DatabaseWithTransaction): void {
  // 1. Check if tables exist
  const tableCheck = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    .get() as { name: string } | undefined;

  if (!tableCheck) {
    const candidatePaths = [
      path.join(process.cwd(), 'server/src/db/schema.sql'),
      path.join(process.cwd(), 'src/db/schema.sql'),
      path.resolve(__dirname, '../../../src/db/schema.sql'),
      path.resolve(__dirname, '../../src/db/schema.sql'),
      path.resolve(__dirname, '../src/db/schema.sql'),
      path.resolve(__dirname, 'schema.sql'),
    ];
    const schemaPath = candidatePaths.find((p) => fs.existsSync(p)) || candidatePaths[0];
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);
  }

  // 2. Check if users table is empty; if so, run seed automatically
  const userCount = db
    .prepare('SELECT COUNT(*) as count FROM users')
    .get() as { count: number | bigint } | undefined;

  if (!userCount || Number(userCount.count) === 0) {
    runSeed();
  }
}

export function getDb(): DatabaseWithTransaction {
  if (dbInstance) return dbInstance;

  // Resolve SQLite path from DB_PATH with fallback to ./data/carpool.db
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.resolve(process.cwd(), './data/carpool.db');

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath) as DatabaseWithTransaction;

  // Transaction wrapper compatible with synchronous transactional queries
  db.transaction = <T, Args extends unknown[]>(fn: (...args: Args) => T) => {
    return (...args: Args): T => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const result = fn(...args);
        db.exec('COMMIT');
        return result;
      } catch (err) {
        try {
          db.exec('ROLLBACK');
        } catch {
          // ignore rollback errors if not active
        }
        throw err;
      }
    };
  };

  // Enable WAL and foreign keys
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  dbInstance = db;
  initializeDatabase(db);

  return dbInstance;
}

export function closeDb(): void {
  dbInstance = null;
}
