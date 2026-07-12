import { ProgressRepository } from '../../../domain/repositories/ProgressRepository';
import { UserProgress } from '../../../domain/entities/UserProgress';
import { ItemRepository } from '../../../domain/repositories/ItemRepository';

export class InMemoryProgressRepository implements ProgressRepository {
  private progressMap: Map<string, UserProgress> = new Map();

  constructor(private readonly itemRepository: ItemRepository) {}

  private makeKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
  }

  public async findByUserAndItem(userId: string, itemId: string): Promise<UserProgress | null> {
    return this.progressMap.get(this.makeKey(userId, itemId)) || null;
  }

  public async findByUser(userId: string): Promise<UserProgress[]> {
    const list: UserProgress[] = [];
    for (const prog of this.progressMap.values()) {
      if (prog.userId === userId) list.push(prog);
    }
    return list;
  }

  public async save(progress: UserProgress): Promise<UserProgress> {
    const key = this.makeKey(progress.userId, progress.itemId);
    // Clonamos/creamos una nueva instancia con id si no tiene
    const saved = new UserProgress({
      id: progress.id || `prog-${Math.random().toString(36).substr(2, 9)}`,
      userId: progress.userId,
      itemId: progress.itemId,
      status: progress.status,
      currentRank: progress.currentRank,
      updatedAt: new Date()
    });
    this.progressMap.set(key, saved);
    return saved;
  }

  public async getUserTotalMasteryPoints(userId: string): Promise<number> {
    const userProg = await this.findByUser(userId);
    let totalPoints = 0;

    for (const prog of userProg) {
      if (prog.status === 'MASTERED') {
        const item = await this.itemRepository.findById(prog.itemId);
        if (item) {
          totalPoints += item.masteryPoints;
        }
      }
    }
    return totalPoints;
  }
}
