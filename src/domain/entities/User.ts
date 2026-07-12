export type UserRole = 'USER' | 'ADMIN';

export interface UserProps {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id(): string { return this.props.id; }
  get username(): string { return this.props.username; }
  get email(): string { return this.props.email; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): UserRole { return this.props.role; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Regla de negocio: verificar si es administrador
  public isAdmin(): boolean {
    return this.props.role === 'ADMIN';
  }
}
