import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '../auth/JwtTokenService';

const tokenService = new JwtTokenService();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = tokenService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Sesión inválida o expirada. Por favor, inicia sesión de nuevo.' });
  }

  req.user = decoded;
  next();
};

export const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  next();
};
