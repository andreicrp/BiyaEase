import { getDatabasePool } from '../database/index.js';
import { logger } from '../utils/logger.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
}

export class AuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const pool = getDatabasePool();
    if (!pool) return null;

    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query<UserRecord>(
      'SELECT id, email, password_hash, display_name, created_at, updated_at, last_login_at FROM users WHERE LOWER(email) = $1 LIMIT 1;',
      [normalizedEmail]
    );

    return result.rows[0] || null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const pool = getDatabasePool();
    if (!pool) return null;

    const result = await pool.query<UserRecord>(
      'SELECT id, email, password_hash, display_name, created_at, updated_at, last_login_at FROM users WHERE id = $1 LIMIT 1;',
      [id]
    );

    return result.rows[0] || null;
  }

  async createUser(email: string, passwordHash: string, displayName: string): Promise<UserRecord> {
    const pool = getDatabasePool();
    if (!pool) throw new Error('Database connection unavailable');

    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query<UserRecord>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, password_hash, display_name, created_at, updated_at, last_login_at;`,
      [normalizedEmail, passwordHash, displayName.trim()]
    );

    logger.info(`[AUTH] User created successfully: ${result.rows[0]?.id}`);
    return result.rows[0]!;
  }

  async updateLastLogin(id: string): Promise<void> {
    const pool = getDatabasePool();
    if (!pool) return;

    await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;', [id]);
  }
}

export const authRepository = new AuthRepository();
