import { env } from '{{envImport}}';

export const databaseUrl = env.get('DATABASE_URL').required().asUrl();
