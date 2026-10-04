import { UserEntity } from '{{entityImport}}';
{{#if prisma}}
import type { User as UserRow } from '{{generatedImport}}';
{{else}}
import type { users } from '{{schemaImport}}';

type UserRow = typeof users.$inferSelect;
{{/if}}

export class UserMapper {
  static toDomain(row: UserRow): UserEntity {
    return UserEntity.create({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
