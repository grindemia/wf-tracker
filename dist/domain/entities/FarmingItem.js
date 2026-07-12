"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FarmingItem = void 0;
class FarmingItem {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get userId() { return this.props.userId; }
    get itemId() { return this.props.itemId; }
    get notes() { return this.props.notes; }
    get addedAt() { return this.props.addedAt; }
}
exports.FarmingItem = FarmingItem;
