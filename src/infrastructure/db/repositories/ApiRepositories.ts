import { ItemRepository } from '../../../domain/repositories/ItemRepository';
import { ProgressRepository } from '../../../domain/repositories/ProgressRepository';
import { FarmingRepository } from '../../../domain/repositories/FarmingRepository';
import { RelicFarmingRepository } from '../../../domain/repositories/RelicFarmingRepository';

import { Item, ItemCategory } from '../../../domain/entities/Item';
import { UserProgress } from '../../../domain/entities/UserProgress';
import { FarmingItem } from '../../../domain/entities/FarmingItem';
import { ItemComponent } from '../../../domain/entities/ItemComponent';
import { Relic } from '../../../domain/entities/Relic';
import { RelicDrop } from '../../../domain/entities/RelicDrop';

const getHeaders = (hasBody = false): Record<string, string> => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export class ApiItemRepository implements ItemRepository {
  async findById(id: string): Promise<Item | null> {
    const response = await fetch(`/api/items/${encodeURIComponent(id)}`);
    if (response.status === 404) return null;
    const data = await response.json();
    return new Item(data);
  }

  async findByCategory(category: ItemCategory): Promise<Item[]> {
    const response = await fetch(`/api/items/category/${encodeURIComponent(category)}`);
    const data = await response.json();
    return data.map((item: any) => new Item(item));
  }

  async findAll(): Promise<Item[]> {
    const response = await fetch('/api/items');
    const data = await response.json();
    return data.map((item: any) => new Item(item));
  }

  async save(item: Item): Promise<Item> {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: item.id,
        name: item.name,
        uniqueName: item.uniqueName,
        category: item.category,
        masteryPoints: item.masteryPoints,
        maxRank: item.maxRank,
        wikiaUrl: item.wikiaUrl,
        imageUrl: item.imageUrl,
        components: item.components
      })
    });
    const data = await response.json();
    return new Item(data);
  }

  async saveMany(items: Item[]): Promise<void> {
    await fetch('/api/items/batch', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          uniqueName: item.uniqueName,
          category: item.category,
          masteryPoints: item.masteryPoints,
          maxRank: item.maxRank,
          wikiaUrl: item.wikiaUrl,
          imageUrl: item.imageUrl,
          components: item.components
        }))
      })
    });
  }
}

export class ApiProgressRepository implements ProgressRepository {
  async findByUser(userId: string): Promise<UserProgress[]> {
    const response = await fetch('/api/progress', {
      headers: getHeaders()
    });
    const data = await response.json();
    return data.map((prog: any) => new UserProgress({
      ...prog,
      updatedAt: prog.updatedAt ? new Date(prog.updatedAt) : undefined
    }));
  }

  async findByUserAndItem(userId: string, itemId: string): Promise<UserProgress | null> {
    const response = await fetch(`/api/progress/detail?itemId=${encodeURIComponent(itemId)}`, {
      headers: getHeaders()
    });
    if (response.status === 404) return null;
    const data = await response.json();
    return new UserProgress({
      ...data,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    });
  }

  async save(progress: UserProgress): Promise<UserProgress> {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: progress.id,
        userId: progress.userId,
        itemId: progress.itemId,
        status: progress.status,
        currentRank: progress.currentRank
      })
    });
    const data = await response.json();
    return new UserProgress({
      ...data,
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
    });
  }

  async getUserTotalMasteryPoints(userId: string): Promise<number> {
    const response = await fetch('/api/progress/mastery-points', {
      headers: getHeaders()
    });
    const data = await response.json();
    return data.totalMasteryPoints;
  }
}

export class ApiFarmingRepository implements FarmingRepository {
  async findByUser(userId: string): Promise<FarmingItem[]> {
    const response = await fetch('/api/farming', {
      headers: getHeaders()
    });
    const data = await response.json();
    return data.map((f: any) => new FarmingItem({
      ...f,
      addedAt: new Date(f.addedAt)
    }));
  }

  async findByUserAndItem(userId: string, itemId: string): Promise<FarmingItem | null> {
    const response = await fetch(`/api/farming/detail?itemId=${encodeURIComponent(itemId)}`, {
      headers: getHeaders()
    });
    if (response.status === 404) return null;
    const data = await response.json();
    return new FarmingItem({
      ...data,
      addedAt: new Date(data.addedAt)
    });
  }

  async save(item: FarmingItem): Promise<FarmingItem> {
    const response = await fetch('/api/farming', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: item.id,
        userId: item.userId,
        itemId: item.itemId,
        notes: item.notes,
        addedAt: item.addedAt
      })
    });
    const data = await response.json();
    return new FarmingItem({
      ...data,
      addedAt: new Date(data.addedAt)
    });
  }

  async delete(userId: string, itemId: string): Promise<void> {
    await fetch(`/api/farming?itemId=${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  }
}

export class ApiRelicFarmingRepository implements RelicFarmingRepository {
  async findComponentsByItemId(itemId: string): Promise<ItemComponent[]> {
    const response = await fetch(`/api/relic-farming/components?itemId=${encodeURIComponent(itemId)}`);
    const data = await response.json();
    return data.map((c: any) => new ItemComponent(c));
  }

  async findDropsByComponentId(componentId: string): Promise<{ drop: RelicDrop; relic: Relic }[]> {
    const response = await fetch(`/api/relic-farming/drops?componentId=${encodeURIComponent(componentId)}`);
    const data = await response.json();
    return data.map((d: any) => ({
      drop: new RelicDrop(d.drop),
      relic: new Relic(d.relic)
    }));
  }

  async saveComponent(component: ItemComponent): Promise<ItemComponent> {
    const response = await fetch('/api/relic-farming/components', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: component.id,
        itemId: component.itemId,
        name: component.name,
        uniqueName: component.uniqueName
      })
    });
    const data = await response.json();
    return new ItemComponent(data);
  }

  async saveRelic(relic: Relic): Promise<Relic> {
    const response = await fetch('/api/relic-farming/relics', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: relic.id,
        era: relic.era,
        name: relic.name,
        vaulted: relic.vaulted
      })
    });
    const data = await response.json();
    return new Relic(data);
  }

  async saveDrop(drop: RelicDrop): Promise<RelicDrop> {
    const response = await fetch('/api/relic-farming/drops', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        id: drop.id,
        componentId: drop.componentId,
        relicId: drop.relicId,
        rarity: drop.rarity,
        chance: drop.chance
      })
    });
    const data = await response.json();
    return new RelicDrop(data);
  }
}
