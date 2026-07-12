import { FarmingItem } from '../entities/FarmingItem';

export interface FarmingRepository {
  findByUser(userId: string): Promise<FarmingItem[]>;
  findByUserAndItem(userId: string, itemId: string): Promise<FarmingItem | null>;
  save(farmingItem: FarmingItem): Promise<FarmingItem>;
  delete(userId: string, itemId: string): Promise<void>;
}
