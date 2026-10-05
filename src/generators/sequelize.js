import { layout } from './layout.js';
import { DATABASE_CONFIG, databaseConfigFile, ormDatabase, requireClean } from './shared.js';

const DIR = `${layout(true).data}/sequelize`;
export const SEQUELIZE_CLIENT = `${DIR}/sequelize.client.ts`;
export const SEQUELIZE_USER_MODEL = `${DIR}/models/user.model.ts`;
const SYNC = `${DIR}/sync.ts`;

export const sequelizeUserModel = { template: 'sequelize/user.model.ts.tpl', to: SEQUELIZE_USER_MODEL };

export const sequelize = {
  name: 'sequelize',
  usage: 'sequelize',
  description: 'ORM Sequelize: modelos con Model.init (sin decoradores), singleton, sync y Postgres en docker (requiere clean)',
  requiresName: false,
  plan: ({ features, project }) => {
    requireClean(features, 'g sequelize');
    return {
      files: [
        databaseConfigFile(features),
        sequelizeUserModel,
        {
          template: 'sequelize/sequelize.client.ts.tpl',
          to: SEQUELIZE_CLIENT,
          imports: { databaseConfigImport: DATABASE_CONFIG, userModelImport: SEQUELIZE_USER_MODEL },
        },
        { template: 'sequelize/sync.ts.tpl', to: SYNC, imports: { clientImport: SEQUELIZE_CLIENT } },
      ],
      dependencies: ['sequelize@^6', 'pg', 'pg-hstore'],
      devDependencies: ['tsx'],
      ...ormDatabase(project),
      scripts: {
        'sequelize:sync': `tsx ${SYNC}`,
      },
      notes: [
        'Siguientes pasos:\n' +
          '  docker compose up -d postgres\n' +
          '  npm run sequelize:sync     # crea las tablas que falten (solo desarrollo)\n' +
          'En producción usa migraciones (sequelize-cli o umzug).',
      ],
    };
  },
};
