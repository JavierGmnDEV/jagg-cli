{{#if cache}}
import { UserEntity, type UserPrimitives } from '{{entityImport}}';
{{else}}
import type { UserEntity } from '{{entityImport}}';
{{/if}}
import { UserNotFoundError } from '{{errorsImport}}';
import type { UserRepository } from '{{repositoryImport}}';
{{#if cache}}
import type { {{cacheContract}} } from '{{cacheImport}}';
import { USER_CACHE_TTL_SECONDS, userCacheKeys } from '{{cacheKeysImport}}';
{{/if}}

export class GetUserByIdUseCase {
  constructor(
    private readonly repository: UserRepository,
{{#if cache}}
    private readonly cache: {{cacheContract}},
{{/if}}
  ) {}

  async execute(id: string): Promise<UserEntity> {
{{#if cache}}
    const cached = await this.cache.get<UserPrimitives>(userCacheKeys.byId(id));
    if (cached) return UserEntity.create(cached);

{{/if}}
    const user = await this.repository.findById(id);
    if (!user) throw new UserNotFoundError(id);
{{#if cache}}

    await this.cache.set(userCacheKeys.byId(id), user, USER_CACHE_TTL_SECONDS);
{{/if}}
    return user;
  }
}
