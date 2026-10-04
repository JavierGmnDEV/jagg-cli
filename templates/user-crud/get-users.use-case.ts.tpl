{{#if cache}}
import { UserEntity, type UserPrimitives } from '{{entityImport}}';
{{else}}
import type { UserEntity } from '{{entityImport}}';
{{/if}}
import type { UserRepository } from '{{repositoryImport}}';
{{#if cache}}
import type { {{cacheContract}} } from '{{cacheImport}}';
import { USER_CACHE_TTL_SECONDS, userCacheKeys } from '{{cacheKeysImport}}';
{{/if}}

export class GetUsersUseCase {
  constructor(
    private readonly repository: UserRepository,
{{#if cache}}
    private readonly cache: {{cacheContract}},
{{/if}}
  ) {}

  async execute(): Promise<UserEntity[]> {
{{#if cache}}
    const cached = await this.cache.get<UserPrimitives[]>(userCacheKeys.all);
    if (cached) return cached.map((user) => UserEntity.create(user));

    const users = await this.repository.findAll();
    await this.cache.set(userCacheKeys.all, users, USER_CACHE_TTL_SECONDS);
    return users;
{{else}}
    return this.repository.findAll();
{{/if}}
  }
}
