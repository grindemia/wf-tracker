import { PrismaClient } from '@prisma/client';
import { RelicFarmingRepository } from '../../../domain/repositories/RelicFarmingRepository';
import { ItemComponent } from '../../../domain/entities/ItemComponent';
import { Relic } from '../../../domain/entities/Relic';
import { RelicDrop } from '../../../domain/entities/RelicDrop';

export class PrismaRelicFarmingRepository implements RelicFarmingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public async findComponentsByItemId(itemId: string): Promise<ItemComponent[]> {
    const rawComponents = await this.prisma.itemComponent.findMany({
      where: { itemId },
    });
    return rawComponents.map(raw => new ItemComponent({
      id: raw.id,
      itemId: raw.itemId,
      name: raw.name,
      uniqueName: raw.uniqueName,
    }));
  }

  public async findDropsByComponentId(componentId: string): Promise<{ drop: RelicDrop; relic: Relic }[]> {
    const rawDrops = await this.prisma.relicDropTable.findMany({
      where: { componentId },
      include: {
        relic: true,
      },
    });

    return rawDrops.map(raw => {
      const drop = new RelicDrop({
        id: raw.id,
        componentId: raw.componentId,
        relicId: raw.relicId,
        rarity: raw.rarity as 'BRONZE' | 'SILVER' | 'GOLD',
        chance: raw.chance || undefined,
      });

      const relic = new Relic({
        id: raw.relic.id,
        era: raw.relic.era,
        name: raw.relic.name,
        vaulted: raw.relic.vaulted,
      });

      return { drop, relic };
    });
  }

  public async saveComponent(component: ItemComponent): Promise<ItemComponent> {
    const raw = await this.prisma.itemComponent.upsert({
      where: { id: component.id },
      update: {
        itemId: component.itemId,
        name: component.name,
        uniqueName: component.uniqueName,
      },
      create: {
        id: component.id,
        itemId: component.itemId,
        name: component.name,
        uniqueName: component.uniqueName,
      },
    });
    return new ItemComponent({
      id: raw.id,
      itemId: raw.itemId,
      name: raw.name,
      uniqueName: raw.uniqueName,
    });
  }

  public async saveRelic(relic: Relic): Promise<Relic> {
    const raw = await this.prisma.relic.upsert({
      where: { id: relic.id },
      update: {
        era: relic.era,
        name: relic.name,
        vaulted: relic.vaulted,
      },
      create: {
        id: relic.id,
        era: relic.era,
        name: relic.name,
        vaulted: relic.vaulted,
      },
    });
    return new Relic({
      id: raw.id,
      era: raw.era,
      name: raw.name,
      vaulted: raw.vaulted,
    });
  }

  public async saveDrop(drop: RelicDrop): Promise<RelicDrop> {
    const raw = await this.prisma.relicDropTable.upsert({
      where: {
        componentId_relicId: {
          componentId: drop.componentId,
          relicId: drop.relicId,
        },
      },
      update: {
        rarity: drop.rarity,
        chance: drop.chance || null,
      },
      create: {
        id: drop.id,
        componentId: drop.componentId,
        relicId: drop.relicId,
        rarity: drop.rarity,
        chance: drop.chance || null,
      },
    });
    return new RelicDrop({
      id: raw.id,
      componentId: raw.componentId,
      relicId: raw.relicId,
      rarity: raw.rarity as 'BRONZE' | 'SILVER' | 'GOLD',
      chance: raw.chance || undefined,
    });
  }
}
