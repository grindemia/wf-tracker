import { FarmingRepository } from '../../../domain/repositories/FarmingRepository';
import { FarmingItem } from '../../../domain/entities/FarmingItem';

export class InMemoryFarmingRepository implements FarmingRepository {
  private farmingMap: Map<string, FarmingItem> = new Map();

  private makeKey(userId: string, itemId: string): string {
    return `${userId}:${itemId}`;
  }

  public async findByUser(userId: string): Promise<FarmingItem[]> {
    const list: FarmingItem[] = [];
    for (const item of this.farmingMap.values()) {
      if (item.userId === userId) list.push(item);
    }
    return list;
  }

  public async findByUserAndItem(userId: string, itemId: string): Promise<FarmingItem | null> {
    return this.farmingMap.get(this.makeKey(userId, itemId)) || null;
  }

  public async save(farmingItem: FarmingItem): Promise<FarmingItem> {
    const key = this.makeKey(farmingItem.userId, farmingItem.itemId);
    const saved = new FarmingItem({
      id: farmingItem.id || `farm-${Math.random().toString(36).substr(2, 9)}`,
      userId: farmingItem.userId,
      itemId: farmingItem.itemId,
      notes: farmingItem.notes,
      addedAt: farmingItem.addedAt
    });
    this.farmingMap.set(key, saved);
    return saved;
  }

  public async delete(userId: string, itemId: string): Promise<void> {
    this.farmingMap.delete(this.makeKey(userId, itemId));
  }
}
