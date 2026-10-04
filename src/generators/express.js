import { requireClean } from './shared.js';

const SRC = '{{srcDir}}';
const HTTP = `${SRC}/presentation/http`;
const LOAD_ENV = `${SRC}/load-env.ts`;
const APP = `${HTTP}/app.ts`;
const ROUTES = `${HTTP}/routes/index.ts`;
const HEALTH_ROUTES = `${HTTP}/routes/health.routes.ts`;
const HTTP_ERROR = `${HTTP}/errors/http-error.ts`;
const NOT_FOUND = `${HTTP}/middlewares/not-found.ts`;
const ERROR_HANDLER = `${HTTP}/middlewares/error-handler.ts`;
const APP_CONFIG = `${SRC}/infrastructure/env/app.config.ts`;

export const express = {
  name: 'express',
  usage: 'express',
  description: 'servidor Express 5 + TypeScript listo para usar: tsconfig, dev/build/start, Dockerfile (requiere clean)',
  requiresName: false,
  plan: ({ features }) => {
    requireClean(features, 'g express');
    return {
      files: [
        { template: 'express/tsconfig.json.tpl', to: 'tsconfig.json' },
        { template: 'express/tsup.config.ts.tpl', to: 'tsup.config.ts' },
        { template: 'express/gitignore.tpl', to: '.gitignore' },
        { template: 'express/dockerignore.tpl', to: '.dockerignore' },
        { template: 'express/Dockerfile.tpl', to: 'Dockerfile' },
        { template: 'express/load-env.ts.tpl', to: LOAD_ENV },
        features.env
          ? {
              template: 'express/main.env.ts.tpl',
              to: `${SRC}/main.ts`,
              imports: { loadEnvImport: LOAD_ENV, appImport: APP, appConfigImport: APP_CONFIG },
            }
          : {
              template: 'express/main.ts.tpl',
              to: `${SRC}/main.ts`,
              imports: { loadEnvImport: LOAD_ENV, appImport: APP },
            },
        {
          template: 'express/app.ts.tpl',
          to: APP,
          imports: { routesImport: ROUTES, notFoundImport: NOT_FOUND, errorHandlerImport: ERROR_HANDLER },
        },
        { template: 'express/routes.ts.tpl', to: ROUTES, imports: { healthRoutesImport: HEALTH_ROUTES } },
        { template: 'express/health.routes.ts.tpl', to: HEALTH_ROUTES },
        { template: 'express/http-error.ts.tpl', to: HTTP_ERROR },
        { template: 'express/not-found.ts.tpl', to: NOT_FOUND, imports: { httpErrorImport: HTTP_ERROR } },
        { template: 'express/error-handler.ts.tpl', to: ERROR_HANDLER, imports: { httpErrorImport: HTTP_ERROR } },
      ],
      dependencies: ['express@^5', 'cors', 'helmet'],
      devDependencies: ['typescript', 'tsx', 'tsup', '@types/node', '@types/express', '@types/cors'],
      packageJson: { type: 'module' },
      scripts: {
        dev: `tsx watch ${SRC}/main.ts`,
        build: 'tsup',
        start: 'node dist/main.js',
        typecheck: 'tsc --noEmit',
      },
      env: {
        NODE_ENV: 'development',
        PORT: '3000',
      },
      notes: [
        'Siguientes pasos:\n' +
          '  npm run dev                              # http://localhost:3000/api/health\n' +
          '  npm run build && npm start               # producción\n' +
          '  docker build -t mi-api . && docker run -p 3000:3000 mi-api',
      ],
    };
  },
};
