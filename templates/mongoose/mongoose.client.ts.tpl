import mongoose, { type Connection } from 'mongoose';
import { mongoUrl } from '{{configImport}}';

export class MongooseDatabase {
  private static connection: Connection | null = null;

  private constructor() {}

  /** Conexión propia (no la global de mongoose); las consultas esperan en buffer hasta que conecta. */
  static getInstance(): Connection {
    MongooseDatabase.connection ??= mongoose.createConnection(mongoUrl);
    return MongooseDatabase.connection;
  }

  static async disconnect(): Promise<void> {
    await MongooseDatabase.connection?.close();
    MongooseDatabase.connection = null;
  }
}
