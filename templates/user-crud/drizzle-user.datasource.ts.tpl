import { desc, eq } from 'drizzle-orm';
import type { Database } from '{{clientImport}}';
import { users } from '{{schemaImport}}';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import { UserMapper } from '{{mapperImport}}';

const UNIQUE_VIOLATION = '23505';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Drizzle envuelve el error de pg: el código puede venir en el propio error o en `cause`. */
function isUniqueViolation(error: unknown): boolean {
  for (let current = error; typeof current === 'object' && current !== null; current = (current as Error).cause) {
    if ('code' in current && current.code === UNIQUE_VIOLATION) return true;
  }
  return false;
}

export class DrizzleUserDatasource extends UserDatasource {
  constructor(private readonly db: Database) {
    super();
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      const [row] = await this.db.insert(users).values(data).returning();
      if (!row) throw new Error('No se pudo crear el usuario');
      return UserMapper.toDomain(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyInUseError(data.email);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findById(id: string): Promise<UserEntity | null> {
    // La columna es uuid: un id con otro formato haría fallar la consulta en Postgres
    if (!UUID_REGEX.test(id)) return null;
    const [row] = await this.db.select().from(users).where(eq(users.id, id));
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    return row ? UserMapper.toDomain(row) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    if (!UUID_REGEX.test(id)) return null;
    try {
      const [row] = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
      return row ? UserMapper.toDomain(row) : null;
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyInUseError(data.email ?? '');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_REGEX.test(id)) return false;
    const rows = await this.db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
    return rows.length > 0;
  }
}
