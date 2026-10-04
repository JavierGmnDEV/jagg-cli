export interface {{pascal}}Props {
  id: string;
  createdAt: Date;
}

export class {{pascal}} {
  private constructor(private readonly props: {{pascal}}Props) {}

  static create(props: Omit<{{pascal}}Props, 'createdAt'> & { createdAt?: Date }): {{pascal}} {
    return new {{pascal}}({ ...props, createdAt: props.createdAt ?? new Date() });
  }

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): {{pascal}}Props {
    return { ...this.props };
  }
}
