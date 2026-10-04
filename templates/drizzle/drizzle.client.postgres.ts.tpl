import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PostgresClient } from '{{postgresClientImport}}';
import * as schema from '{{schemaIndexImport}}';

export type Database = NodePgDatabase<typeof schema>;

export class DrizzleDatabase {
  private static instance: Database | null = null;

  private constructor() {}

  static getInstance(): Database {
    DrizzleDatabase.instance ??= drizzle(PostgresClient.getInstance(), { schema });
    return DrizzleDatabase.instance;
  }

  static async disconnect(): Promise<void> {
    await PostgresClient.disconnect();
    DrizzleDatabase.instance = null;
  }
}
