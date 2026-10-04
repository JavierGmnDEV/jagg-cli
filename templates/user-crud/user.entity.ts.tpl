export interface UserPrimitives {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /** Acepta fechas como string para reconstruir datos serializados (p. ej. desde caché). */
  static create(props: UserPrimitives): UserEntity {
    return new UserEntity(props.id, props.name, props.email, new Date(props.createdAt), new Date(props.updatedAt));
  }
}
