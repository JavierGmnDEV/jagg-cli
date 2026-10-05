import { UserEntity } from '{{entityImport}}';
import type { UserRecord } from '{{schemaImport}}';

export class UserMapper {
  static toDomain(row: UserRecord): UserEntity {
    return UserEntity.create({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
