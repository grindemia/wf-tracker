import { UserRepository } from '../../../domain/repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';
import { TokenService } from './TokenService';

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export class LoginUser {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: { identity: string; password: string }): Promise<LoginResult> {
    // Buscar por correo o nombre de usuario
    let user = await this.userRepo.findByEmail(dto.identity);
    if (!user) {
      user = await this.userRepo.findByUsername(dto.identity);
    }

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const isPasswordValid = await this.passwordHasher.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Usuario o contraseña incorrectos.');
    }

    const token = this.tokenService.generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }
}
