import { RelicFarmingRepository } from '../../../domain/repositories/RelicFarmingRepository';
import { ItemRepository } from '../../../domain/repositories/ItemRepository';

export interface GetFarmingPathInput {
  itemId: string;
}

export interface FarmingPathRelic {
  relicId: string;
  era: string;
  name: string;
  vaulted: boolean;
  rarity: 'BRONZE' | 'SILVER' | 'GOLD';
  chance?: number;
}

export interface FarmingPathComponent {
  componentId: string;
  name: string;
  uniqueName: string;
  relics: FarmingPathRelic[];
}

export interface GetFarmingPathOutput {
  itemId: string;
  itemName: string;
  components: FarmingPathComponent[];
}

export class GetFarmingPathByItemId {
  constructor(
    private readonly relicFarmingRepository: RelicFarmingRepository,
    private readonly itemRepository: ItemRepository
  ) {}

  public async execute(input: GetFarmingPathInput): Promise<GetFarmingPathOutput> {
    // 1. Validar que el item existe
    const item = await this.itemRepository.findById(input.itemId);
    if (!item) {
      throw new Error(`El ítem con ID ${input.itemId} no existe.`);
    }

    // 2. Obtener componentes para este item
    const components = await this.relicFarmingRepository.findComponentsByItemId(input.itemId);

    // 3. Para cada componente, buscar los drops de reliquias
    const mappedComponents: FarmingPathComponent[] = [];
    for (const comp of components) {
      const dropDetails = await this.relicFarmingRepository.findDropsByComponentId(comp.id);
      
      const relics: FarmingPathRelic[] = dropDetails.map(({ drop, relic }) => ({
        relicId: relic.id,
        era: relic.era,
        name: relic.name,
        vaulted: relic.vaulted,
        rarity: drop.rarity,
        chance: drop.chance,
      }));

      mappedComponents.push({
        componentId: comp.id,
        name: comp.name,
        uniqueName: comp.uniqueName,
        relics,
      });
    }

    return {
      itemId: item.id,
      itemName: item.name,
      components: mappedComponents,
    };
  }
}
