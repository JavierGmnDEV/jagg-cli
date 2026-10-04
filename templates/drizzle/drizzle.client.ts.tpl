import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { databaseUrl } from '{{databaseConfigImport}}';
import * as schema from '{{schemaIndexImport}}';

export type Database = NodePgDatabase<typeof schema>;

export class DrizzleDatabase {
  private static pool: Pool | null = null;
  private static instance: Database | null = null;

  private constructor() {}

  static getInstance(): Database {
    if (!DrizzleDatabase.instance) {
      DrizzleDatabase.pool = new Pool({ connectionString: databaseUrl });
      DrizzleDatabase.instance = drizzle(DrizzleDatabase.pool, { schema });
    }
    return DrizzleDatabase.instance;
  }

  static async disconnect(): Promise<void> {
    await DrizzleDatabase.pool?.end();
    DrizzleDatabase.pool = null;
    DrizzleDatabase.instance = null;
  }
}
