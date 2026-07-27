import jwt from 'jsonwebtoken';
import { TokenService } from '../../application/use-cases/auth/TokenService';

export class JwtTokenService implements TokenService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'grindemia_secret_key_orokin';
  }

  generateToken(payload: { userId: string; username: string; role: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: '7d' });
  }

  verifyToken(token: string): { userId: string; username: string; role: string } | null {
    try {
      return jwt.verify(token, this.secret) as { userId: string; username: string; role: string };
    } catch {
      return null;
    }
  }
}
