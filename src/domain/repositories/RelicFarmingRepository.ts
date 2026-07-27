import { ItemComponent } from '../entities/ItemComponent';
import { Relic } from '../entities/Relic';
import { RelicDrop } from '../entities/RelicDrop';

export interface RelicFarmingRepository {
  findComponentsByItemId(itemId: string): Promise<ItemComponent[]>;
  findDropsByComponentId(componentId: string): Promise<{ drop: RelicDrop; relic: Relic }[]>;
  saveComponent(component: ItemComponent): Promise<ItemComponent>;
  saveRelic(relic: Relic): Promise<Relic>;
  saveDrop(drop: RelicDrop): Promise<RelicDrop>;
}
