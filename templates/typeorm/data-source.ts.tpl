import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { databaseUrl } from '{{databaseConfigImport}}';
import { UserSchema } from '{{userSchemaImport}}';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [UserSchema],
  migrations: [fileURLToPath(new URL('./migrations/*.js', import.meta.url))],
  synchronize: false,
  logging: false,
});
