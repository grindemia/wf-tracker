"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkItemAsMastered = void 0;
const UserProgress_1 = require("../../../domain/entities/UserProgress");
class MarkItemAsMastered {
    progressRepository;
    itemRepository;
    constructor(progressRepository, itemRepository) {
        this.progressRepository = progressRepository;
        this.itemRepository = itemRepository;
    }
    async execute(input) {
        // 1. Verificar que el ítem existe en el catálogo
        const item = await this.itemRepository.findById(input.itemId);
        if (!item) {
            throw new Error(`El ítem con ID ${input.itemId} no existe en el catálogo.`);
        }
        // 2. Buscar si el usuario ya tiene progreso registrado
        let progress = await this.progressRepository.findByUserAndItem(input.userId, input.itemId);
        if (!progress) {
            // Si no existe, creamos un nuevo registro de progreso
            progress = new UserProgress_1.UserProgress({
                userId: input.userId,
                itemId: input.itemId,
                status: 'PENDING',
                currentRank: 0
            });
        }
        // 3. Ejecutar regla de negocio en la entidad (marcar como masterizado con su rango máximo)
        progress.markAsMastered(item.maxRank);
        // 4. Guardar los cambios en la persistencia
        await this.progressRepository.save(progress);
        // 5. Calcular los nuevos puntos de maestría totales del usuario
        const newTotalPoints = await this.progressRepository.getUserTotalMasteryPoints(input.userId);
        return {
            status: progress.status,
            currentRank: progress.currentRank,
            newTotalMasteryPoints: newTotalPoints
        };
    }
}
exports.MarkItemAsMastered = MarkItemAsMastered;
