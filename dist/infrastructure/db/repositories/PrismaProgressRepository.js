"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaProgressRepository = void 0;
const UserProgress_1 = require("../../../domain/entities/UserProgress");
class PrismaProgressRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUserAndItem(userId, itemId) {
        const rawProgress = await this.prisma.userProgress.findUnique({
            where: {
                userId_itemId: { userId, itemId }
            }
        });
        if (!rawProgress)
            return null;
        return this.mapToDomain(rawProgress);
    }
    async findByUser(userId) {
        const rawProgressList = await this.prisma.userProgress.findMany({
            where: { userId }
        });
        return rawProgressList.map((raw) => this.mapToDomain(raw));
    }
    async save(progress) {
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
    async getUserTotalMasteryPoints(userId) {
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
        return masteredProgress.reduce((total, progress) => {
            return total + (progress.item?.masteryPoints || 0);
        }, 0);
    }
    mapToDomain(raw) {
        return new UserProgress_1.UserProgress({
            id: raw.id,
            userId: raw.userId,
            itemId: raw.itemId,
            status: raw.status,
            currentRank: raw.currentRank,
            updatedAt: raw.updatedAt,
        });
    }
}
exports.PrismaProgressRepository = PrismaProgressRepository;
