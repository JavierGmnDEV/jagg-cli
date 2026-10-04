import { layout } from './layout.js';
import { ENV_PROVIDER, ENV_TIP, postgresCompose, postgresEnv } from './shared.js';

export const postgres = {
  name: 'postgres',
  usage: 'postgres',
  description: 'PostgreSQL: config, pool singleton y servicio docker',
  requiresName: false,
  plan: ({ project, features }) => {
    const dir = features.clean ? `${layout(true).data}/postgres` : null;
    const config = dir ? `${dir}/postgres.config.ts` : '{{srcDir}}/infrastructure/config/postgres.config.ts';
    const client = dir ? `${dir}/postgres.client.ts` : '{{srcDir}}/infrastructure/database/postgres.client.ts';

    return {
      files: [
        {
          template: features.env ? 'postgres/postgres.config.env.ts.tpl' : 'postgres/postgres.config.ts.tpl',
          to: config,
          imports: features.env ? { envImport: ENV_PROVIDER } : {},
        },
        { template: 'postgres/postgres.client.ts.tpl', to: client, imports: { configImport: config } },
      ],
      dependencies: ['pg'],
      devDependencies: ['@types/pg'],
      env: postgresEnv(project),
      compose: postgresCompose,
      notes: features.env ? [] : [ENV_TIP],
    };
  },
};
