export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
}

export const redisConfig: Readonly<RedisConfig> = Object.freeze({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB ?? 0),
  keyPrefix: process.env.REDIS_KEY_PREFIX ?? '',
});
