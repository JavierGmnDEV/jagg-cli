import type { UserEntity } from '{{entityImport}}';

export interface CreateUserData {
  name: string;
  email: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export abstract class UserDatasource {
  abstract create(data: CreateUserData): Promise<UserEntity>;
  abstract findAll(): Promise<UserEntity[]>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  /** null si el usuario no existe. */
  abstract update(id: string, data: UpdateUserData): Promise<UserEntity | null>;
  /** false si el usuario no existe. */
  abstract delete(id: string): Promise<boolean>;
}
