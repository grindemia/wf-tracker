import { Item, ItemCategory } from '../entities/Item';

export interface ItemRepository {
  findById(id: string): Promise<Item | null>;
  findByCategory(category: ItemCategory): Promise<Item[]>;
  save(item: Item): Promise<Item>;
  saveMany(items: Item[]): Promise<void>;
  findAll(): Promise<Item[]>;
}
