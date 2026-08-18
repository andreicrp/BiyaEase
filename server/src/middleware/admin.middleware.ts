import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { getDatabasePool } from '../database/index.js';

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.user.id) {
    res.status(401).json({
      success: false,
      error: 'Authentication required before accessing admin resources.',
    });
    return;
  }

  const pool = getDatabasePool();
  if (!pool) {
    res.status(500).json({ success: false, error: 'Database unavailable' });
    return;
  }

  const result = await pool.query<{ is_admin: boolean }>(
    'SELECT is_admin FROM users WHERE id = $1 LIMIT 1;',
    [req.user.id]
  );

  const isAdmin = result.rows[0]?.is_admin === true;
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Administrative privileges required.',
    });
    return;
  }

  next();
}
