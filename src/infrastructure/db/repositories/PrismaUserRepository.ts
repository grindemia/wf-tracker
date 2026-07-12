import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { User, UserRole } from '../../../domain/entities/User';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: string): Promise<User | null> {
    const rawUser = await this.prisma.user.findUnique({ where: { id } });
    if (!rawUser) return null;
    return this.mapToDomain(rawUser);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const rawUser = await this.prisma.user.findUnique({ where: { email } });
    if (!rawUser) return null;
    return this.mapToDomain(rawUser);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const rawUser = await this.prisma.user.findUnique({ where: { username } });
    if (!rawUser) return null;
    return this.mapToDomain(rawUser);
  }

  public async save(user: User): Promise<User> {
    const rawUser = await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
      create: {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return this.mapToDomain(rawUser);
  }

  private mapToDomain(raw: any): User {
    return new User({
      id: raw.id,
      username: raw.username,
      email: raw.email,
      passwordHash: raw.passwordHash,
      role: raw.role as UserRole,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
