import { defineConfig, env } from 'prisma/config';

try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: se usan las variables del entorno
}

export default defineConfig({
  schema: '{{srcDir}}/infrastructure/data/prisma/schema.prisma',
  migrations: {
    path: '{{srcDir}}/infrastructure/data/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
