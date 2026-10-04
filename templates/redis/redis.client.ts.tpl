import { Redis } from 'ioredis';
import { redisConfig } from '{{configImport}}';

export class RedisClient {
  private static instance: Redis | null = null;

  private constructor() {}

  static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis({
        ...redisConfig,
        maxRetriesPerRequest: 3,
      });
      RedisClient.instance.on('error', (error) => {
        console.error('[redis]', error);
      });
    }
    return RedisClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (!RedisClient.instance) return;
    await RedisClient.instance.quit();
    RedisClient.instance = null;
  }
}
