import type { DataSource, Repository } from 'typeorm';
import { UserSchema, type UserRecord } from '{{schemaImport}}';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import { UserMapper } from '{{mapperImport}}';

const UNIQUE_VIOLATION = '23505';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** TypeORM envuelve el error de pg (QueryFailedError.driverError). */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ('code' in error && error.code === UNIQUE_VIOLATION) return true;
  return 'driverError' in error && isUniqueViolation(error.driverError);
}

export class TypeOrmUserDatasource extends UserDatasource {
  /** Recibe una función porque TypeORM inicializa la conexión de forma asíncrona. */
  constructor(private readonly connect: () => Promise<DataSource>) {
    super();
  }

  private async users(): Promise<Repository<UserRecord>> {
    return (await this.connect()).getRepository(UserSchema);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const users = await this.users();
    try {
      return UserMapper.toDomain(await users.save(users.create(data)));
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyInUseError(data.email);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await (await this.users()).find({ order: { createdAt: 'DESC' } });
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findById(id: string): Promise<UserEntity | null> {
    // La columna es uuid: un id con otro formato haría fallar la consulta en Postgres
    if (!UUID_REGEX.test(id)) return null;
    const row = await (await this.users()).findOneBy({ id });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await (await this.users()).findOneBy({ email });
    return row ? UserMapper.toDomain(row) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    if (!UUID_REGEX.test(id)) return null;
    const users = await this.users();
    const row = await users.findOneBy({ id });
    if (!row) return null;
    try {
      return UserMapper.toDomain(await users.save(users.merge(row, data)));
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyInUseError(data.email ?? '');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_REGEX.test(id)) return false;
    const { affected } = await (await this.users()).delete({ id });
    return (affected ?? 0) > 0;
  }
}
