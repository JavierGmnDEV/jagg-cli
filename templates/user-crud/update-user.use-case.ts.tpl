import type { UpdateUserDto } from '{{updateDtoImport}}';
import type { UserEntity } from '{{entityImport}}';
import { EmailAlreadyInUseError, UserNotFoundError } from '{{errorsImport}}';
import type { UserRepository } from '{{repositoryImport}}';
{{#if cache}}
import type { {{cacheContract}} } from '{{cacheImport}}';
import { userCacheKeys } from '{{cacheKeysImport}}';
{{/if}}

export class UpdateUserUseCase {
  constructor(
    private readonly repository: UserRepository,
{{#if cache}}
    private readonly cache: {{cacheContract}},
{{/if}}
  ) {}

  async execute(dto: UpdateUserDto): Promise<UserEntity> {
    if (dto.email !== undefined) {
      const owner = await this.repository.findByEmail(dto.email);
      if (owner && owner.id !== dto.id) throw new EmailAlreadyInUseError(dto.email);
    }

    const user = await this.repository.update(dto.id, dto.changes);
    if (!user) throw new UserNotFoundError(dto.id);
{{#if cache}}

    await Promise.all([this.cache.delete(userCacheKeys.all), this.cache.delete(userCacheKeys.byId(dto.id))]);
{{/if}}
    return user;
  }
}
