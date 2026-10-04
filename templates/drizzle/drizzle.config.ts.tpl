import { defineConfig } from 'drizzle-kit';

try {
  process.loadEnvFile();
} catch {
  // sin archivo .env: se usan las variables del entorno
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('La variable de entorno DATABASE_URL no está definida');

export default defineConfig({
  dialect: 'postgresql',
  schema: './{{srcDir}}/infrastructure/data/drizzle/schema/*.schema.ts',
  out: './{{srcDir}}/infrastructure/data/drizzle/migrations',
  dbCredentials: { url },
});
