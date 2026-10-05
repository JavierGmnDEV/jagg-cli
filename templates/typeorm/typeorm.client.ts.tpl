import type { DataSource } from 'typeorm';
import { AppDataSource } from '{{dataSourceImport}}';

export class TypeOrmDatabase {
  private static connecting: Promise<DataSource> | null = null;

  private constructor() {}

  /** Inicializa la conexión una sola vez; las llamadas concurrentes esperan a la misma promesa. */
  static getInstance(): Promise<DataSource> {
    TypeOrmDatabase.connecting ??= AppDataSource.initialize().catch((error: unknown) => {
      TypeOrmDatabase.connecting = null;
      throw error;
    });
    return TypeOrmDatabase.connecting;
  }

  static async disconnect(): Promise<void> {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
    TypeOrmDatabase.connecting = null;
  }
}
