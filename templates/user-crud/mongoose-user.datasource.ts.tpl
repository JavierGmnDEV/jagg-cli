import type { Connection } from 'mongoose';
import { getUserModel, type UserDocument, type UserModel } from '{{schemaImport}}';
import { type CreateUserData, UserDatasource, type UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import { UserMapper } from '{{mapperImport}}';

const DUPLICATE_KEY = 11000;
const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/i;

const isDuplicateKey = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === DUPLICATE_KEY;

export class MongooseUserDatasource extends UserDatasource {
  private readonly users: UserModel;

  constructor(connection: Connection) {
    super();
    this.users = getUserModel(connection);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    try {
      return UserMapper.toDomain(await this.users.create(data));
    } catch (error) {
      if (isDuplicateKey(error)) throw new EmailAlreadyInUseError(data.email);
      throw error;
    }
  }

  async findAll(): Promise<UserEntity[]> {
    const docs = await this.users.find().sort({ createdAt: -1 }).lean<UserDocument[]>();
    return docs.map((doc) => UserMapper.toDomain(doc));
  }

  async findById(id: string): Promise<UserEntity | null> {
    // Un id que no es ObjectId lanzaría CastError
    if (!OBJECT_ID_REGEX.test(id)) return null;
    const doc = await this.users.findById(id).lean<UserDocument>();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.users.findOne({ email }).lean<UserDocument>();
    return doc ? UserMapper.toDomain(doc) : null;
  }

  async update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    if (!OBJECT_ID_REGEX.test(id)) return null;
    try {
      const doc = await this.users
        .findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
        .lean<UserDocument>();
      return doc ? UserMapper.toDomain(doc) : null;
    } catch (error) {
      if (isDuplicateKey(error)) throw new EmailAlreadyInUseError(data.email ?? '');
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    if (!OBJECT_ID_REGEX.test(id)) return false;
    const { deletedCount } = await this.users.deleteOne({ _id: id });
    return deletedCount > 0;
  }
}
