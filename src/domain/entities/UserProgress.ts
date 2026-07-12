export type ProgressStatus = 'PENDING' | 'LEVELING' | 'MASTERED';

export interface UserProgressProps {
  id?: string;
  userId: string;
  itemId: string;
  status: ProgressStatus;
  currentRank: number;
  updatedAt?: Date;
}

export class UserProgress {
  private props: UserProgressProps;

  constructor(props: UserProgressProps) {
    this.props = {
      ...props,
      currentRank: this.validateRank(props.currentRank, props.status)
    };
  }

  get id(): string | undefined { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get itemId(): string { return this.props.itemId; }
  get status(): ProgressStatus { return this.props.status; }
  get currentRank(): number { return this.props.currentRank; }
  get updatedAt(): Date | undefined { return this.props.updatedAt; }

  // Regla de Negocio: Validar y ajustar rango según el estado de progreso
  private validateRank(rank: number, status: ProgressStatus): number {
    if (status === 'MASTERED') {
      return 30; // Valor por defecto, se ajusta con maxRank del Item
    }
    if (status === 'PENDING') {
      return 0;
    }
    return Math.max(0, rank);
  }

  // Regla de Negocio: Marcar como Masterizado
  public markAsMastered(maxRank: number = 30): void {
    this.props.status = 'MASTERED';
    this.props.currentRank = maxRank;
    this.props.updatedAt = new Date();
  }

  // Regla de Negocio: Actualizar nivel parcial
  public updateRank(newRank: number, maxRank: number = 30): void {
    if (newRank < 0 || newRank > maxRank) {
      throw new Error(`El rango debe estar entre 0 y ${maxRank}`);
    }
    this.props.currentRank = newRank;
    this.props.status = newRank === maxRank ? 'MASTERED' : 'LEVELING';
    this.props.updatedAt = new Date();
  }
}
