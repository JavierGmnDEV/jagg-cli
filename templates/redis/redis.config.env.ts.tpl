import { env } from '{{envImport}}';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

export const redisConfig: Readonly<RedisConfig> = Object.freeze({
  host: env.get('REDIS_HOST').default('localhost').asString(),
  port: env.get('REDIS_PORT').default('6379').asPort(),
  password: env.get('REDIS_PASSWORD').asString(),
  db: env.get('REDIS_DB').default('0').asInt(),
  keyPrefix: env.get('REDIS_KEY_PREFIX').default('').asString(),
});
