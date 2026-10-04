import { UserNotFoundError } from '{{errorsImport}}';
import type { UserRepository } from '{{repositoryImport}}';
{{#if cache}}
import type { {{cacheContract}} } from '{{cacheImport}}';
import { userCacheKeys } from '{{cacheKeysImport}}';
{{/if}}

export class DeleteUserUseCase {
  constructor(
    private readonly repository: UserRepository,
{{#if cache}}
    private readonly cache: {{cacheContract}},
{{/if}}
  ) {}

  async execute(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new UserNotFoundError(id);
{{#if cache}}

    await Promise.all([this.cache.delete(userCacheKeys.all), this.cache.delete(userCacheKeys.byId(id))]);
{{/if}}
  }
}
