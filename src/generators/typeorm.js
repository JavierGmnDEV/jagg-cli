import { layout } from './layout.js';
import { DATABASE_CONFIG, databaseConfigFile, ormDatabase, requireClean } from './shared.js';

const DIR = `${layout(true).data}/typeorm`;
export const TYPEORM_CLIENT = `${DIR}/typeorm.client.ts`;
export const TYPEORM_USER_SCHEMA = `${DIR}/entities/user.schema.ts`;
const DATA_SOURCE = `${DIR}/data-source.ts`;
const CLI_ENTRY = `${DIR}/typeorm.cli.ts`;
const MIGRATIONS = `${DIR}/migrations`;
const CLI = `tsx ./node_modules/typeorm/cli.js`;

export const typeormUserSchema = { template: 'typeorm/user.schema.ts.tpl', to: TYPEORM_USER_SCHEMA };

export const typeorm = {
  name: 'typeorm',
  usage: 'typeorm',
  description: 'ORM TypeORM: DataSource con EntitySchema (sin decoradores), singleton, migraciones y Postgres en docker (requiere clean)',
  requiresName: false,
  plan: ({ features, project }) => {
    requireClean(features, 'g typeorm');
    return {
      files: [
        databaseConfigFile(features),
        typeormUserSchema,
        {
          template: 'typeorm/data-source.ts.tpl',
          to: DATA_SOURCE,
          imports: { databaseConfigImport: DATABASE_CONFIG, userSchemaImport: TYPEORM_USER_SCHEMA },
        },
        { template: 'typeorm/typeorm.client.ts.tpl', to: TYPEORM_CLIENT, imports: { dataSourceImport: DATA_SOURCE } },
        { template: 'typeorm/typeorm.cli.ts.tpl', to: CLI_ENTRY, imports: { dataSourceImport: DATA_SOURCE } },
        { content: '', to: `${MIGRATIONS}/.gitkeep` },
      ],
      dependencies: ['typeorm@^1', 'pg'],
      devDependencies: ['@types/pg', 'tsx'],
      ...ormDatabase(project),
      scripts: {
        'typeorm:generate': `${CLI} migration:generate -d ${CLI_ENTRY} -o --esm ${MIGRATIONS}/migration`,
        'typeorm:migrate': `${CLI} migration:run -d ${CLI_ENTRY}`,
        'typeorm:revert': `${CLI} migration:revert -d ${CLI_ENTRY}`,
      },
      notes: [
        'Siguientes pasos:\n' +
          '  docker compose up -d postgres\n' +
          '  npm run typeorm:generate   # migración (JS ESM) a partir de los EntitySchema\n' +
          '  npm run typeorm:migrate',
      ],
    };
  },
};
