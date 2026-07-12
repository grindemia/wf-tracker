"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddItemToFarmingList = void 0;
const FarmingItem_1 = require("../../../domain/entities/FarmingItem");
class AddItemToFarmingList {
    farmingRepository;
    itemRepository;
    constructor(farmingRepository, itemRepository) {
        this.farmingRepository = farmingRepository;
        this.itemRepository = itemRepository;
    }
    async execute(input) {
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
        const farmingItem = new FarmingItem_1.FarmingItem({
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
exports.AddItemToFarmingList = AddItemToFarmingList;
