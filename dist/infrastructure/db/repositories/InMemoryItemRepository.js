"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryItemRepository = void 0;
class InMemoryItemRepository {
    items = new Map();
    async findById(id) {
        return this.items.get(id) || null;
    }
    async findByCategory(category) {
        const list = [];
        for (const item of this.items.values()) {
            if (item.category === category)
                list.push(item);
        }
        return list;
    }
    async save(item) {
        this.items.set(item.id, item);
        return item;
    }
    async saveMany(items) {
        for (const item of items) {
            await this.save(item);
        }
    }
    async findAll() {
        return Array.from(this.items.values());
    }
}
exports.InMemoryItemRepository = InMemoryItemRepository;
