"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaFarmingRepository = void 0;
const FarmingItem_1 = require("../../../domain/entities/FarmingItem");
class PrismaFarmingRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByUser(userId) {
        const rawFarmingItems = await this.prisma.farmingItem.findMany({
            where: { userId }
        });
        return rawFarmingItems.map((raw) => this.mapToDomain(raw));
    }
    async findByUserAndItem(userId, itemId) {
        const rawFarmingItem = await this.prisma.farmingItem.findUnique({
            where: {
                userId_itemId: { userId, itemId }
            }
        });
        if (!rawFarmingItem)
            return null;
        return this.mapToDomain(rawFarmingItem);
    }
    async save(farmingItem) {
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
    async delete(userId, itemId) {
        await this.prisma.farmingItem.delete({
            where: {
                userId_itemId: { userId, itemId }
            }
        });
    }
    mapToDomain(raw) {
        return new FarmingItem_1.FarmingItem({
            id: raw.id,
            userId: raw.userId,
            itemId: raw.itemId,
            notes: raw.notes || undefined,
            addedAt: raw.addedAt,
        });
    }
}
exports.PrismaFarmingRepository = PrismaFarmingRepository;
