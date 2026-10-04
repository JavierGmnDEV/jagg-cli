import { randomUUID } from 'node:crypto';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';

/** Datos en memoria (se pierden al reiniciar). Cámbialo por un datasource con ORM: jg g prisma | jg g drizzle */
export class InMemoryUserDatasource extends UserDatasource {
  private readonly users = new Map<string, UserEntity>();

  async create(data: CreateUserData): Promise<UserEntity> {
    if (await this.findByEmail(data.email)) throw new EmailAlreadyInUseError(data.email);
    const now = new Date();
    const user = UserEntity.create({ id: randomUUID(), ...data, createdAt: now, updatedAt: now });
    this.users.set(user.id, user);
    return user;
  }

  async findAll(): Promise<UserEntity[]> {
    return [...this.users.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    const current = this.users.get(id);
    if (!current) return null;
    if (data.email !== undefined) {
      const owner = await this.findByEmail(data.email);
      if (owner && owner.id !== id) throw new EmailAlreadyInUseError(data.email);
    }
    const user = UserEntity.create({ ...current, ...data, updatedAt: new Date() });
    this.users.set(id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}
