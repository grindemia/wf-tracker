import { PrismaClient } from '@prisma/client';
import { FarmingRepository } from '../../../domain/repositories/FarmingRepository';
import { FarmingItem } from '../../../domain/entities/FarmingItem';

export class PrismaFarmingRepository implements FarmingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByUser(userId: string): Promise<FarmingItem[]> {
    const rawFarmingItems = await this.prisma.farmingItem.findMany({
      where: { userId }
    });
    return rawFarmingItems.map((raw: any) => this.mapToDomain(raw));
  }

  public async findByUserAndItem(userId: string, itemId: string): Promise<FarmingItem | null> {
    const rawFarmingItem = await this.prisma.farmingItem.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });
    if (!rawFarmingItem) return null;
    return this.mapToDomain(rawFarmingItem);
  }

  public async save(farmingItem: FarmingItem): Promise<FarmingItem> {
    const rawFarmingItem = await this.prisma.farmingItem.upsert({
      where: {
        userId_itemId: {
          userId: farmingItem.userId,
          itemId: farmingItem.itemId
        }
      },
      update: {
        notes: farmingItem.notes || null,
      },
      create: {
        userId: farmingItem.userId,
        itemId: farmingItem.itemId,
        notes: farmingItem.notes || null,
      }
    });
    return this.mapToDomain(rawFarmingItem);
  }

  public async delete(userId: string, itemId: string): Promise<void> {
    await this.prisma.farmingItem.delete({
      where: {
        userId_itemId: { userId, itemId }
      }
    });
  }

  private mapToDomain(raw: any): FarmingItem {
    return new FarmingItem({
      id: raw.id,
      userId: raw.userId,
      itemId: raw.itemId,
      notes: raw.notes || undefined,
      addedAt: raw.addedAt,
    });
  }
}
