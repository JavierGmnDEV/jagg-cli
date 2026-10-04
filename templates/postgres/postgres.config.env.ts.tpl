import type { PoolConfig } from 'pg';
import { env } from '{{envImport}}';

export const postgresConfig: Readonly<PoolConfig> = Object.freeze({
  host: env.get('POSTGRES_HOST').default('localhost').asString(),
  port: env.get('POSTGRES_PORT').default('5432').asPort(),
  user: env.get('POSTGRES_USER').default('postgres').asString(),
  password: env.get('POSTGRES_PASSWORD').default('postgres').asString(),
  database: env.get('POSTGRES_DB').required().asString(),
  max: env.get('POSTGRES_POOL_MAX').default('10').asInt(),
});
