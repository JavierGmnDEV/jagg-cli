import type { CreateUserData, UpdateUserData } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';

export abstract class UserRepository {
  abstract create(data: CreateUserData): Promise<UserEntity>;
  abstract findAll(): Promise<UserEntity[]>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  /** null si el usuario no existe. */
  abstract update(id: string, data: UpdateUserData): Promise<UserEntity | null>;
  /** false si el usuario no existe. */
  abstract delete(id: string): Promise<boolean>;
}
