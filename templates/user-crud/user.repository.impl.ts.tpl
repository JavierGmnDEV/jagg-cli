import type { CreateUserData, UpdateUserData, UserDatasource } from '{{datasourceImport}}';
import type { UserEntity } from '{{entityImport}}';
import { UserRepository } from '{{repositoryImport}}';

/** Delega en el datasource: cambiar de ORM solo implica inyectar otro datasource. */
export class UserRepositoryImpl extends UserRepository {
  constructor(private readonly datasource: UserDatasource) {
    super();
  }

  create(data: CreateUserData): Promise<UserEntity> {
    return this.datasource.create(data);
  }

  findAll(): Promise<UserEntity[]> {
    return this.datasource.findAll();
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.datasource.findById(id);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.datasource.findByEmail(email);
  }

  update(id: string, data: UpdateUserData): Promise<UserEntity | null> {
    return this.datasource.update(id, data);
  }

  delete(id: string): Promise<boolean> {
    return this.datasource.delete(id);
  }
}
