import { PrismaClient } from '@prisma/client';
import { ItemRepository } from '../../../domain/repositories/ItemRepository';
import { Item, ItemCategory } from '../../../domain/entities/Item';

export class PrismaItemRepository implements ItemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findById(id: string): Promise<Item | null> {
    const rawItem = await this.prisma.item.findUnique({ where: { id } });
    if (!rawItem) return null;
    return this.mapToDomain(rawItem);
  }

  public async findByCategory(category: ItemCategory): Promise<Item[]> {
    const rawItems = await this.prisma.item.findMany({ where: { category } });
    return rawItems.map((raw: any) => this.mapToDomain(raw));
  }

  public async save(item: Item): Promise<Item> {
    const componentsStr = item.components ? JSON.stringify(item.components) : null;
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
        components: componentsStr,
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
        components: componentsStr,
      },
    });
    return this.mapToDomain(rawItem);
  }

  public async saveMany(items: Item[]): Promise<void> {
    // Usamos una transacción o queries en paralelo para upsert
    // En producción se puede optimizar con createMany/updateMany
    const promises = items.map(item => this.save(item));
    await Promise.all(promises);
  }

  public async findAll(): Promise<Item[]> {
    const rawItems = await this.prisma.item.findMany();
    return rawItems.map((raw: any) => this.mapToDomain(raw));
  }

  private mapToDomain(raw: any): Item {
    let parsedComponents: any = undefined;
    if (raw.components) {
      try {
        parsedComponents = JSON.parse(raw.components);
      } catch (e) {
        parsedComponents = raw.components;
      }
    }
    return new Item({
      id: raw.id,
      name: raw.name,
      uniqueName: raw.uniqueName,
      category: raw.category as ItemCategory,
      masteryPoints: raw.masteryPoints,
      maxRank: raw.maxRank,
      wikiaUrl: raw.wikiaUrl || undefined,
      imageUrl: raw.imageUrl || undefined,
      components: parsedComponents,
    });
  }
}
