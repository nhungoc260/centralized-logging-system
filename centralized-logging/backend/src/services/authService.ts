import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string, role = 'developer'): Promise<{
    user: IUser;
    token: string;
  }> {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already in use');

    const user = await User.create({ email, password, name, role });
    const token = this.generateToken(user);

    logger.info(`New user registered: ${email}`);
    return { user, token };
  }

  /**
   * Login with email/password
   */
  async login(email: string, password: string): Promise<{
    user: IUser;
    token: string;
  }> {
    const user = await User.findOne({ email }).select('+password');
    if (!user) throw new Error('Invalid credentials');

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new Error('Invalid credentials');

    const token = this.generateToken(user);
    logger.info(`User logged in: ${email}`);
    return { user, token };
  }

  /**
   * Generate JWT token
   */
  generateToken(user: IUser): string {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role } as TokenPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
}

export const authService = new AuthService();
