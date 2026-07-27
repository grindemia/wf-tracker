export interface ItemComponentProps {
  id: string;
  itemId: string;
  name: string;
  uniqueName: string;
}

export class ItemComponent {
  constructor(private readonly props: ItemComponentProps) {}

  get id(): string { return this.props.id; }
  get itemId(): string { return this.props.itemId; }
  get name(): string { return this.props.name; }
  get uniqueName(): string { return this.props.uniqueName; }
}
