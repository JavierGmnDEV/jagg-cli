import type { PoolConfig } from 'pg';

export const postgresConfig: Readonly<PoolConfig> = Object.freeze({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB,
  max: Number(process.env.POSTGRES_POOL_MAX ?? 10),
});
