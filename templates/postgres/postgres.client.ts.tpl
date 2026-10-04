import { Pool, type QueryResultRow } from 'pg';
import { postgresConfig } from '{{configImport}}';

export class PostgresClient {
  private static instance: Pool | null = null;

  private constructor() {}

  static getInstance(): Pool {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new Pool(postgresConfig);
      PostgresClient.instance.on('error', (error) => {
        console.error('[postgres]', error);
      });
    }
    return PostgresClient.instance;
  }

  static async query<T extends QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
    const result = await PostgresClient.getInstance().query<T>(text, params);
    return result.rows;
  }

  static async disconnect(): Promise<void> {
    if (!PostgresClient.instance) return;
    await PostgresClient.instance.end();
    PostgresClient.instance = null;
  }
}
