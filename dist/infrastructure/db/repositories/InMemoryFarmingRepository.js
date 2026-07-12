"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryFarmingRepository = void 0;
const FarmingItem_1 = require("../../../domain/entities/FarmingItem");
class InMemoryFarmingRepository {
    farmingMap = new Map();
    makeKey(userId, itemId) {
        return `${userId}:${itemId}`;
    }
    async findByUser(userId) {
        const list = [];
        for (const item of this.farmingMap.values()) {
            if (item.userId === userId)
                list.push(item);
        }
        return list;
    }
    async findByUserAndItem(userId, itemId) {
        return this.farmingMap.get(this.makeKey(userId, itemId)) || null;
    }
    async save(farmingItem) {
        const key = this.makeKey(farmingItem.userId, farmingItem.itemId);
        const saved = new FarmingItem_1.FarmingItem({
            id: farmingItem.id || `farm-${Math.random().toString(36).substr(2, 9)}`,
            userId: farmingItem.userId,
            itemId: farmingItem.itemId,
            notes: farmingItem.notes,
            addedAt: farmingItem.addedAt
        });
        this.farmingMap.set(key, saved);
        return saved;
    }
    async delete(userId, itemId) {
        this.farmingMap.delete(this.makeKey(userId, itemId));
    }
}
exports.InMemoryFarmingRepository = InMemoryFarmingRepository;
