import { PrismaClient } from '@prisma/client';
import { ProgressRepository } from '../../../domain/repositories/ProgressRepository';
import { UserProgress, ProgressStatus } from '../../../domain/entities/UserProgress';

export class PrismaProgressRepository implements ProgressRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findByUserAndItem(userId: string, itemId: string): Promise<UserProgress | null> {
    const rawProgress = await this.prisma.userProgress.findUnique({
      where: {
        userId_itemId: { userId, itemId }
      }
    });
    if (!rawProgress) return null;
    return this.mapToDomain(rawProgress);
  }

  public async findByUser(userId: string): Promise<UserProgress[]> {
    const rawProgressList = await this.prisma.userProgress.findMany({
      where: { userId }
    });
    return rawProgressList.map((raw: any) => this.mapToDomain(raw));
  }

  public async save(progress: UserProgress): Promise<UserProgress> {
    const rawProgress = await this.prisma.userProgress.upsert({
      where: {
        userId_itemId: {
          userId: progress.userId,
          itemId: progress.itemId
        }
      },
      update: {
        status: progress.status,
        currentRank: progress.currentRank,
      },
      create: {
        userId: progress.userId,
        itemId: progress.itemId,
        status: progress.status,
        currentRank: progress.currentRank,
      }
    });
    return this.mapToDomain(rawProgress);
  }

  public async getUserTotalMasteryPoints(userId: string): Promise<number> {
    // Calculamos los puntos de maestría sumando los puntos de maestría de todos los ítems masterizados (MASTERED)
    const masteredProgress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        status: 'MASTERED'
      },
      include: {
        item: true
      }
    });

    return masteredProgress.reduce((total: number, progress: any) => {
      return total + (progress.item?.masteryPoints || 0);
    }, 0);
  }

  private mapToDomain(raw: any): UserProgress {
    return new UserProgress({
      id: raw.id,
      userId: raw.userId,
      itemId: raw.itemId,
      status: raw.status as ProgressStatus,
      currentRank: raw.currentRank,
      updatedAt: raw.updatedAt,
    });
  }
}
