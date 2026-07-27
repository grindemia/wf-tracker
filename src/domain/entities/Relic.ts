export interface RelicProps {
  id: string;
  era: string;
  name: string;
  vaulted: boolean;
}

export class Relic {
  constructor(private readonly props: RelicProps) {}

  get id(): string { return this.props.id; }
  get era(): string { return this.props.era; }
  get name(): string { return this.props.name; }
  get vaulted(): boolean { return this.props.vaulted; }
}
