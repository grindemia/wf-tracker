"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProgress = void 0;
class UserProgress {
    props;
    constructor(props) {
        this.props = {
            ...props,
            currentRank: this.validateRank(props.currentRank, props.status)
        };
    }
    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get itemId() { return this.props.itemId; }
    get status() { return this.props.status; }
    get currentRank() { return this.props.currentRank; }
    get updatedAt() { return this.props.updatedAt; }
    // Regla de Negocio: Validar y ajustar rango según el estado de progreso
    validateRank(rank, status) {
        if (status === 'MASTERED') {
            return 30; // Valor por defecto, se ajusta con maxRank del Item
        }
        if (status === 'PENDING') {
            return 0;
        }
        return Math.max(0, rank);
    }
    // Regla de Negocio: Marcar como Masterizado
    markAsMastered(maxRank = 30) {
        this.props.status = 'MASTERED';
        this.props.currentRank = maxRank;
        this.props.updatedAt = new Date();
    }
    // Regla de Negocio: Actualizar nivel parcial
    updateRank(newRank, maxRank = 30) {
        if (newRank < 0 || newRank > maxRank) {
            throw new Error(`El rango debe estar entre 0 y ${maxRank}`);
        }
        this.props.currentRank = newRank;
        this.props.status = newRank === maxRank ? 'MASTERED' : 'LEVELING';
        this.props.updatedAt = new Date();
    }
}
exports.UserProgress = UserProgress;
