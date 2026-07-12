import { ItemRepository } from '../../../domain/repositories/ItemRepository';
import { Item, ItemCategory } from '../../../domain/entities/Item';

export class InMemoryItemRepository implements ItemRepository {
  private items: Map<string, Item> = new Map();

  public async findById(id: string): Promise<Item | null> {
    return this.items.get(id) || null;
  }

  public async findByCategory(category: ItemCategory): Promise<Item[]> {
    const list: Item[] = [];
    for (const item of this.items.values()) {
      if (item.category === category) list.push(item);
    }
    return list;
  }

  public async save(item: Item): Promise<Item> {
    this.items.set(item.id, item);
    return item;
  }

  public async saveMany(items: Item[]): Promise<void> {
    for (const item of items) {
      await this.save(item);
    }
  }

  public async findAll(): Promise<Item[]> {
    return Array.from(this.items.values());
  }
}
