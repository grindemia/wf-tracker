export type ItemCategory = 
  | 'WARFRAME' 
  | 'PRIMARY_WEAPON' 
  | 'SECONDARY_WEAPON' 
  | 'MELEE_WEAPON' 
  | 'COMPANION' 
  | 'VEHICLE' 
  | 'OTHER';

export interface ItemProps {
  id: string;
  name: string;
  uniqueName: string;
  category: ItemCategory;
  masteryPoints: number;
  maxRank: number;
  wikiaUrl?: string;
  imageUrl?: string;
  components?: any; // Componentes necesarios para fabricarlo
}

export class Item {
  constructor(private readonly props: ItemProps) {}

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get uniqueName(): string { return this.props.uniqueName; }
  get category(): ItemCategory { return this.props.category; }
  get masteryPoints(): number { return this.props.masteryPoints; }
  get maxRank(): number { return this.props.maxRank; }
  get wikiaUrl(): string | undefined { return this.props.wikiaUrl; }
  get imageUrl(): string | undefined { return this.props.imageUrl; }
  get components(): any { return this.props.components; }
}
