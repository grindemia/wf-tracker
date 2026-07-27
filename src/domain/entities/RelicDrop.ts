export interface RelicDropProps {
  id: string;
  componentId: string;
  relicId: string;
  rarity: 'BRONZE' | 'SILVER' | 'GOLD';
  chance?: number;
}

export class RelicDrop {
  constructor(private readonly props: RelicDropProps) {}

  get id(): string { return this.props.id; }
  get componentId(): string { return this.props.componentId; }
  get relicId(): string { return this.props.relicId; }
  get rarity(): 'BRONZE' | 'SILVER' | 'GOLD' { return this.props.rarity; }
  get chance(): number | undefined { return this.props.chance; }
}
