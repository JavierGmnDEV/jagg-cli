import { layout } from './layout.js';
import { ENV_PROVIDER } from './shared.js';

export const env = {
  name: 'env',
  usage: 'env',
  description: 'validador de variables de entorno estilo env-var (contrato de dominio + adapter Zod)',
  requiresName: false,
  plan: ({ features }) => {
    const contracts = features.clean ? layout(true).serviceContracts : '{{srcDir}}/domain/env';
    const infra = '{{srcDir}}/infrastructure/env';
    const port = `${contracts}/env.port.ts`;
    const error = `${contracts}/env-validation.error.ts`;
    const adapter = `${infra}/zod-env.adapter.ts`;

    return {
      files: [
        { template: 'env/env.port.ts.tpl', to: port },
        { template: 'env/env-validation.error.ts.tpl', to: error },
        { template: 'env/zod-env.adapter.ts.tpl', to: adapter, imports: { portImport: port, errorImport: error } },
        { template: 'env/env.provider.ts.tpl', to: ENV_PROVIDER, imports: { portImport: port, adapterImport: adapter } },
        { template: 'env/app.config.ts.tpl', to: `${infra}/app.config.ts`, imports: { providerImport: ENV_PROVIDER } },
      ],
      dependencies: ['zod@^4'],
      env: {
        NODE_ENV: 'development',
        PORT: '3000',
      },
      notes: [
        "Uso: import { env } from '{{srcDir}}/infrastructure/env/env.provider';\n" +
          "     const port = env.get('PORT').required().asPort();",
      ],
    };
  },
};
