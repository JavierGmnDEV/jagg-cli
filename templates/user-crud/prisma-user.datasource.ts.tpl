import type { PrismaClient } from '{{generatedImport}}';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import { UserMapper } from '{{mapperImport}}';

const UNIQUE_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

const hasCode = (error: unknown, code: string): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;

export class PrismaUserDatasource extends UserDatasource {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      return UserMapper.toDomain(await this.prisma.user.create({ data }));
    } catch (error) {
      if (hasCode(error, UNIQUE_VIOLATION)) throw new EmailAlreadyInUseError(data.email);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findById(id: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    try {
      return UserMapper.toDomain(await this.prisma.user.update({ where: { id }, data }));
    } catch (error) {
      if (hasCode(error, RECORD_NOT_FOUND)) return null;
      if (hasCode(error, UNIQUE_VIOLATION)) throw new EmailAlreadyInUseError(data.email ?? '');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const { count } = await this.prisma.user.deleteMany({ where: { id } });
    return count > 0;
  }
}
