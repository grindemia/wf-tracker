import { User } from '../../../domain/entities/User';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { PasswordHasher } from './PasswordHasher';

export class RegisterUser {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(dto: { username: string; email: string; password: string }): Promise<User> {
    const existingEmail = await this.userRepo.findByEmail(dto.email);
    if (existingEmail) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const existingUsername = await this.userRepo.findByUsername(dto.username);
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está en uso.');
    }

    const hashedPassword = await this.passwordHasher.hash(dto.password);
    
    // Generar ID único
    const userId = 'user-' + Math.random().toString(36).substring(2, 11);

    const user = new User({
      id: userId,
      username: dto.username,
      email: dto.email,
      passwordHash: hashedPassword,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return this.userRepo.save(user);
  }
}
