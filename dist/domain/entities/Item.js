"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = void 0;
class Item {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() { return this.props.id; }
    get name() { return this.props.name; }
    get uniqueName() { return this.props.uniqueName; }
    get category() { return this.props.category; }
    get masteryPoints() { return this.props.masteryPoints; }
    get maxRank() { return this.props.maxRank; }
    get wikiaUrl() { return this.props.wikiaUrl; }
    get imageUrl() { return this.props.imageUrl; }
    get components() { return this.props.components; }
}
exports.Item = Item;
