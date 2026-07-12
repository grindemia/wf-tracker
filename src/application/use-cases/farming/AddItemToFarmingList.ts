import { FarmingRepository } from '../../../domain/repositories/FarmingRepository';
import { ItemRepository } from '../../../domain/repositories/ItemRepository';
import { FarmingItem } from '../../../domain/entities/FarmingItem';

export interface AddItemToFarmingListInput {
  userId: string;
  itemId: string;
  notes?: string;
}

export interface AddItemToFarmingListOutput {
  farmingItemId: string;
  userId: string;
  itemId: string;
  notes?: string;
  addedAt: Date;
}

export class AddItemToFarmingList {
  constructor(
    private readonly farmingRepository: FarmingRepository,
    private readonly itemRepository: ItemRepository
  ) {}

  public async execute(input: AddItemToFarmingListInput): Promise<AddItemToFarmingListOutput> {
    // 1. Verificar si el ítem a farmear existe en el catálogo
    const item = await this.itemRepository.findById(input.itemId);
    if (!item) {
      throw new Error(`El ítem con ID ${input.itemId} no existe en el catálogo.`);
    }

    // 2. Verificar si ya está en la lista de farmeo activa del usuario
    const existingFarmingItem = await this.farmingRepository.findByUserAndItem(input.userId, input.itemId);
    if (existingFarmingItem) {
      throw new Error(`El ítem ya se encuentra en tu lista de farmeo activa.`);
    }

    // 3. Crear nueva instancia de entidad de dominio
    const farmingItem = new FarmingItem({
      userId: input.userId,
      itemId: input.itemId,
      notes: input.notes,
      addedAt: new Date()
    });

    // 4. Persistir la entidad a través del repositorio
    const savedItem = await this.farmingRepository.save(farmingItem);

    return {
      farmingItemId: savedItem.id || 'temp-id',
      userId: savedItem.userId,
      itemId: savedItem.itemId,
      notes: savedItem.notes,
      addedAt: savedItem.addedAt
    };
  }
}
