"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryProgressRepository = void 0;
const UserProgress_1 = require("../../../domain/entities/UserProgress");
class InMemoryProgressRepository {
    itemRepository;
    progressMap = new Map();
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    makeKey(userId, itemId) {
        return `${userId}:${itemId}`;
    }
    async findByUserAndItem(userId, itemId) {
        return this.progressMap.get(this.makeKey(userId, itemId)) || null;
    }
    async findByUser(userId) {
        const list = [];
        for (const prog of this.progressMap.values()) {
            if (prog.userId === userId)
                list.push(prog);
        }
        return list;
    }
    async save(progress) {
        const key = this.makeKey(progress.userId, progress.itemId);
        // Clonamos/creamos una nueva instancia con id si no tiene
        const saved = new UserProgress_1.UserProgress({
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
    async getUserTotalMasteryPoints(userId) {
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
exports.InMemoryProgressRepository = InMemoryProgressRepository;
