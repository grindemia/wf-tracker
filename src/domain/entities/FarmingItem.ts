export interface FarmingItemProps {
  id?: string;
  userId: string;
  itemId: string;
  notes?: string;
  addedAt: Date;
}

export class FarmingItem {
  constructor(private readonly props: FarmingItemProps) {}

  get id(): string | undefined { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get itemId(): string { return this.props.itemId; }
  get notes(): string | undefined { return this.props.notes; }
  get addedAt(): Date { return this.props.addedAt; }
}
