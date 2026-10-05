import { Sequelize } from 'sequelize';
import { databaseUrl } from '{{databaseConfigImport}}';
import { initUserModel } from '{{userModelImport}}';

export class SequelizeDatabase {
  private static instance: Sequelize | null = null;

  private constructor() {}

  /** Conecta en la primera consulta; los modelos se registran al crear la instancia. */
  static getInstance(): Sequelize {
    if (!SequelizeDatabase.instance) {
      const sequelize = new Sequelize(databaseUrl, { dialect: 'postgres', logging: false });
      initUserModel(sequelize);
      SequelizeDatabase.instance = sequelize;
    }
    return SequelizeDatabase.instance;
  }

  static async disconnect(): Promise<void> {
    await SequelizeDatabase.instance?.close();
    SequelizeDatabase.instance = null;
  }
}
