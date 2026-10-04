import { layout } from './layout.js';
import { DATABASE_CONFIG, databaseConfigFile, ormDatabase, requireClean } from './shared.js';

const DIR = `${layout(true).data}/prisma`;
export const PRISMA_SCHEMA = `${DIR}/schema.prisma`;
export const PRISMA_CLIENT = `${DIR}/prisma.client.ts`;
export const PRISMA_GENERATED = `${DIR}/generated/client.ts`;

export const prismaModel = (vars) => ({
  to: PRISMA_SCHEMA,
  template: 'prisma/model.prisma.tpl',
  marker: 'model {{pascal}} {',
  vars,
});

/** Modelo User de ejemplo (name/email/fechas), el mismo que usa `jg g user-crud`. */
export const prismaUserModel = {
  to: PRISMA_SCHEMA,
  template: 'prisma/user.model.prisma.tpl',
  marker: 'model User {',
};

export const prisma = {
  name: 'prisma',
  usage: 'prisma',
  description: 'ORM Prisma: schema, cliente singleton, scripts y Postgres en docker (requiere clean)',
  requiresName: false,
  plan: ({ features, project }) => {
    requireClean(features, 'g prisma');
    return {
      files: [
        { template: 'prisma/prisma.config.ts.tpl', to: 'prisma.config.ts' },
        { template: 'prisma/schema.prisma.tpl', to: PRISMA_SCHEMA },
        { content: 'generated/\n', to: `${DIR}/.gitignore` },
        databaseConfigFile(features),
        {
          template: 'prisma/prisma.client.ts.tpl',
          to: PRISMA_CLIENT,
          imports: { generatedImport: PRISMA_GENERATED, databaseConfigImport: DATABASE_CONFIG },
        },
      ],
      appends: [prismaUserModel],
      dependencies: ['@prisma/client@^7', '@prisma/adapter-pg@^7'],
      devDependencies: ['prisma@^7'],
      ...ormDatabase(project),
      scripts: {
        'prisma:generate': 'prisma generate',
        'prisma:migrate': 'prisma migrate dev',
        'prisma:studio': 'prisma studio',
      },
      notes: [
        'Siguientes pasos:\n' +
          '  docker compose up -d postgres\n' +
          '  npm run prisma:migrate -- --name init\n' +
          '  npm run prisma:generate',
      ],
    };
  },
};
