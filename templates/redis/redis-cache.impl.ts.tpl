import type { Redis } from 'ioredis';
import type { {{cacheContract}} } from '{{contractImport}}';
import { RedisClient } from '{{clientImport}}';

export class {{cacheImpl}} implements {{cacheContract}} {
  constructor(private readonly client: Redis = RedisClient.getInstance()) {}

  async get<T = string>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T = string>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
