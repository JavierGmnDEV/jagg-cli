import type { CreateUserDto } from '{{createDtoImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError } from '{{errorsImport}}';
import type { UserRepository } from '{{repositoryImport}}';
{{#if cache}}
import type { {{cacheContract}} } from '{{cacheImport}}';
import { userCacheKeys } from '{{cacheKeysImport}}';
{{/if}}

export class CreateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
{{#if cache}}
    private readonly cache: {{cacheContract}},
{{/if}}
  ) {}

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    if (await this.repository.findByEmail(dto.email)) throw new EmailAlreadyInUseError(dto.email);

    const user = await this.repository.create({ name: dto.name, email: dto.email });
{{#if cache}}
    await this.cache.delete(userCacheKeys.all);
{{/if}}
    return user;
  }
}
