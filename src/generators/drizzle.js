import { layout } from './layout.js';
import { DATABASE_CONFIG, databaseConfigFile, ormDatabase, requireClean } from './shared.js';

const DIR = `${layout(true).data}/drizzle`;
export const DRIZZLE_SCHEMA_INDEX = `${DIR}/schema/index.ts`;
export const DRIZZLE_CLIENT = `${DIR}/drizzle.client.ts`;
const POSTGRES_CLIENT = `${layout(true).data}/postgres/postgres.client.ts`;

export const drizzleTableFile = (kebab) => `${DIR}/schema/${kebab}.schema.ts`;

export const DRIZZLE_USER_SCHEMA = drizzleTableFile('user');

/** Archivo de la tabla + su export en schema/index.ts. */
export function drizzleTable(schemaFile, vars, template = 'drizzle/table.schema.ts.tpl') {
  return {
    file: { template, to: schemaFile, vars },
    append: {
      to: DRIZZLE_SCHEMA_INDEX,
      template: 'drizzle/schema.export.ts.tpl',
      marker: "'{{schemaImport}}'",
      vars,
      imports: { schemaImport: schemaFile },
    },
  };
}

/** Tabla users de ejemplo (name/email/fechas), la misma que usa `jg g user-crud`. */
export const drizzleUserTable = () => drizzleTable(DRIZZLE_USER_SCHEMA, {}, 'drizzle/user.schema.ts.tpl');

export const drizzle = {
  name: 'drizzle',
  usage: 'drizzle',
  description: 'ORM Drizzle: schema, cliente singleton, scripts y Postgres en docker (requiere clean)',
  requiresName: false,
  plan: ({ features, project }) => {
    requireClean(features, 'g drizzle');
    const user = drizzleUserTable();
    const client = features.postgres
      ? {
          template: 'drizzle/drizzle.client.postgres.ts.tpl',
          to: DRIZZLE_CLIENT,
          imports: { postgresClientImport: POSTGRES_CLIENT, schemaIndexImport: DRIZZLE_SCHEMA_INDEX },
        }
      : {
          template: 'drizzle/drizzle.client.ts.tpl',
          to: DRIZZLE_CLIENT,
          imports: { databaseConfigImport: DATABASE_CONFIG, schemaIndexImport: DRIZZLE_SCHEMA_INDEX },
        };

    return {
      files: [
        { template: 'drizzle/drizzle.config.ts.tpl', to: 'drizzle.config.ts' },
        ...(features.postgres ? [] : [databaseConfigFile(features)]),
        client,
        user.file,
        { content: '', to: `${DIR}/migrations/.gitkeep` },
      ],
      appends: [user.append],
      dependencies: ['drizzle-orm', 'pg'],
      devDependencies: ['drizzle-kit', '@types/pg'],
      ...ormDatabase(project),
      scripts: {
        'drizzle:generate': 'drizzle-kit generate',
        'drizzle:migrate': 'drizzle-kit migrate',
        'drizzle:studio': 'drizzle-kit studio',
      },
      notes: [
        'Siguientes pasos:\n' +
          '  docker compose up -d postgres\n' +
          '  npm run drizzle:generate\n' +
          '  npm run drizzle:migrate',
      ],
    };
  },
};
