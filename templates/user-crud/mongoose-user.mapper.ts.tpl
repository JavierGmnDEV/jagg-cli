import { UserEntity } from '{{entityImport}}';
import type { UserDocument } from '{{schemaImport}}';

export class UserMapper {
  static toDomain(doc: UserDocument): UserEntity {
    return UserEntity.create({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
