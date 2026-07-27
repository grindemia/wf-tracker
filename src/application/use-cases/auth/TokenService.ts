export interface TokenService {
  generateToken(payload: { userId: string; username: string; role: string }): string;
  verifyToken(token: string): { userId: string; username: string; role: string } | null;
}
