// auth.service.ts — Handles user signup, login, password hashing, and JWT generation.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/connection';
import { JWT_SECRET } from '../middleware/auth';
import type { User } from '../../../shared/types';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  created_at: string;
}

export function signup(
  name: string,
  email: string,
  password: string,
  phone?: string,
): User {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)')
    .run(name, email, passwordHash, phone || null);

  return {
    id: result.lastInsertRowid as number,
    name,
    email,
    phone: phone || null,
    created_at: new Date().toISOString(),
  };
}

export function login(email: string, password: string): { user: User; token: string } {
  const db = getDb();

  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!row) {
    throw new Error('No account found with this email.');
  }

  const valid = bcrypt.compareSync(password, row.password_hash);
  if (!valid) {
    throw new Error('Incorrect password.');
  }

  const token = jwt.sign({ id: row.id, email: row.email, name: row.name }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      created_at: row.created_at,
    },
    token,
  };
}

export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db
    .prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?')
    .get(id) as User | undefined;
  return row || null;
}

export function updateUser(id: number, name: string, phone: string | null): User | null {
  const db = getDb();
  db.prepare('UPDATE users SET name = ?, phone = ? WHERE id = ?').run(name, phone, id);
  return getUserById(id);
}
