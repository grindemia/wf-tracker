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
    let farmingItem = await this.farmingRepository.findByUserAndItem(input.userId, input.itemId);

    if (farmingItem) {
      // Si ya existe, concatenamos las nuevas notas si no están incluidas
      const currentNotes = farmingItem.notes || '';
      const newNotes = input.notes || '';
      if (newNotes && !currentNotes.includes(newNotes)) {
        farmingItem = new FarmingItem({
          id: farmingItem.id,
          userId: farmingItem.userId,
          itemId: farmingItem.itemId,
          notes: currentNotes ? `${currentNotes} | ${newNotes}` : newNotes,
          addedAt: farmingItem.addedAt
        });
      }
    } else {
      // 3. Crear nueva instancia de entidad de dominio si no existe
      farmingItem = new FarmingItem({
        userId: input.userId,
        itemId: input.itemId,
        notes: input.notes,
        addedAt: new Date()
      });
    }

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
