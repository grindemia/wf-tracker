"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaItemRepository = void 0;
const Item_1 = require("../../../domain/entities/Item");
class PrismaItemRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const rawItem = await this.prisma.item.findUnique({ where: { id } });
        if (!rawItem)
            return null;
        return this.mapToDomain(rawItem);
    }
    async findByCategory(category) {
        const rawItems = await this.prisma.item.findMany({ where: { category } });
        return rawItems.map((raw) => this.mapToDomain(raw));
    }
    async save(item) {
        const rawItem = await this.prisma.item.upsert({
            where: { id: item.id },
            update: {
                name: item.name,
                uniqueName: item.uniqueName,
                category: item.category,
                masteryPoints: item.masteryPoints,
                maxRank: item.maxRank,
                wikiaUrl: item.wikiaUrl || null,
                imageUrl: item.imageUrl || null,
                components: item.components || null,
            },
            create: {
                id: item.id,
                name: item.name,
                uniqueName: item.uniqueName,
                category: item.category,
                masteryPoints: item.masteryPoints,
                maxRank: item.maxRank,
                wikiaUrl: item.wikiaUrl || null,
                imageUrl: item.imageUrl || null,
                components: item.components || null,
            },
        });
        return this.mapToDomain(rawItem);
    }
    async saveMany(items) {
        // Usamos una transacción o queries en paralelo para upsert
        // En producción se puede optimizar con createMany/updateMany
        const promises = items.map(item => this.save(item));
        await Promise.all(promises);
    }
    async findAll() {
        const rawItems = await this.prisma.item.findMany();
        return rawItems.map((raw) => this.mapToDomain(raw));
    }
    mapToDomain(raw) {
        return new Item_1.Item({
            id: raw.id,
            name: raw.name,
            uniqueName: raw.uniqueName,
            category: raw.category,
            masteryPoints: raw.masteryPoints,
            maxRank: raw.maxRank,
            wikiaUrl: raw.wikiaUrl || undefined,
            imageUrl: raw.imageUrl || undefined,
            components: raw.components || undefined,
        });
    }
}
exports.PrismaItemRepository = PrismaItemRepository;
