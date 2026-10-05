import { type Sequelize, UniqueConstraintError } from 'sequelize';
import type { UserModel } from '{{schemaImport}}';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import { UserMapper } from '{{mapperImport}}';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class SequelizeUserDatasource extends UserDatasource {
  private readonly users: typeof UserModel;

  constructor(sequelize: Sequelize) {
    super();
    this.users = sequelize.model('User') as typeof UserModel;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      return UserMapper.toDomain(await this.users.create(data));
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new EmailAlreadyInUseError(data.email);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const rows = await this.users.findAll({ order: [['createdAt', 'DESC']] });
    return rows.map((row) => UserMapper.toDomain(row));
  }

  async findById(id: string): Promise<UserEntity | null> {
    // La columna es uuid: un id con otro formato haría fallar la consulta en Postgres
    if (!UUID_REGEX.test(id)) return null;
    const row = await this.users.findByPk(id);
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await this.users.findOne({ where: { email } });
    return row ? UserMapper.toDomain(row) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    if (!UUID_REGEX.test(id)) return null;
    const row = await this.users.findByPk(id);
    if (!row) return null;
    try {
      return UserMapper.toDomain(await row.update(data));
    } catch (error) {
      if (error instanceof UniqueConstraintError) throw new EmailAlreadyInUseError(data.email ?? '');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_REGEX.test(id)) return false;
    return (await this.users.destroy({ where: { id } })) > 0;
  }
}
