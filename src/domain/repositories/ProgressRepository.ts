import { UserProgress } from '../entities/UserProgress';

export interface ProgressRepository {
  findByUserAndItem(userId: string, itemId: string): Promise<UserProgress | null>;
  findByUser(userId: string): Promise<UserProgress[]>;
  save(progress: UserProgress): Promise<UserProgress>;
  getUserTotalMasteryPoints(userId: string): Promise<number>;
}
