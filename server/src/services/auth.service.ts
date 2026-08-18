import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository, UserRecord } from '../repositories/auth.repository.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env['JWT_SECRET'] || 'biyaease_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN = '7d';

export interface AuthUserPayload {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  user: AuthUserPayload;
  token: string;
}

export class AuthService {
  private formatUser(user: UserRecord): AuthUserPayload {
    return {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at.toISOString(),
      lastLoginAt: user.last_login_at ? user.last_login_at.toISOString() : null,
    };
  }

  private generateToken(user: UserRecord): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        displayName: user.display_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token: string): { sub: string; email: string; displayName: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded || !decoded.sub) return null;
      return decoded;
    } catch {
      return null;
    }
  }

  async register(email: string, password: string, displayName: string): Promise<AuthResponse> {
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (displayName || '').trim();

    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      throw new Error('Please provide a valid email address');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Display name must be at least 2 characters long');
    }

    const existingUser = await authRepository.findByEmail(trimmedEmail);
    if (existingUser) {
      throw new Error('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await authRepository.createUser(trimmedEmail, passwordHash, trimmedName);
    const token = this.generateToken(newUser);

    return {
      user: this.formatUser(newUser),
      token,
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const trimmedEmail = (email || '').trim().toLowerCase();

    if (!trimmedEmail || !password) {
      throw new Error('Email and password are required');
    }

    const user = await authRepository.findByEmail(trimmedEmail);
    if (!user) {
      throw new Error('Invalid email address or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email address or password');
    }

    await authRepository.updateLastLogin(user.id);
    const token = this.generateToken(user);

    logger.info(`[AUTH] User logged in: ${user.email}`);
    return {
      user: this.formatUser(user),
      token,
    };
  }

  async getCurrentUser(userId: string): Promise<AuthUserPayload | null> {
    const user = await authRepository.findById(userId);
    if (!user) return null;
    return this.formatUser(user);
  }
}

export const authService = new AuthService();
