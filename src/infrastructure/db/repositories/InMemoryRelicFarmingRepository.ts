import { RelicFarmingRepository } from '../../../domain/repositories/RelicFarmingRepository';
import { ItemComponent } from '../../../domain/entities/ItemComponent';
import { Relic } from '../../../domain/entities/Relic';
import { RelicDrop } from '../../../domain/entities/RelicDrop';

export class InMemoryRelicFarmingRepository implements RelicFarmingRepository {
  private components: Map<string, ItemComponent> = new Map();
  private relics: Map<string, Relic> = new Map();
  private drops: Map<string, RelicDrop> = new Map();

  public async findComponentsByItemId(itemId: string): Promise<ItemComponent[]> {
    const list: ItemComponent[] = [];
    for (const comp of this.components.values()) {
      if (comp.itemId === itemId) {
        list.push(comp);
      }
    }
    return list;
  }

  public async findDropsByComponentId(componentId: string): Promise<{ drop: RelicDrop; relic: Relic }[]> {
    const results: { drop: RelicDrop; relic: Relic }[] = [];
    for (const drop of this.drops.values()) {
      if (drop.componentId === componentId) {
        const relic = this.relics.get(drop.relicId);
        if (relic) {
          results.push({ drop, relic });
        }
      }
    }
    return results;
  }

  public async saveComponent(component: ItemComponent): Promise<ItemComponent> {
    this.components.set(component.id, component);
    return component;
  }

  public async saveRelic(relic: Relic): Promise<Relic> {
    this.relics.set(relic.id, relic);
    return relic;
  }

  public async saveDrop(drop: RelicDrop): Promise<RelicDrop> {
    this.drops.set(drop.id, drop);
    return drop;
  }
}
