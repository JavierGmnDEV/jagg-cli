import { layout } from './layout.js';

export const ENV_PROVIDER = '{{srcDir}}/infrastructure/env/env.provider.ts';

export const ENV_TIP =
  'Tip: con `jg g env` la config se valida con env.get(...). Si lo generas después,\n' +
  'borra el archivo de config y vuelve a ejecutar este generador.';

export function requireClean(features, command) {
  if (!features.clean) {
    throw new Error(`\`jg ${command}\` necesita la estructura Clean Architecture. Ejecuta primero: jg g clean`);
  }
}

export const dbName = (project) => project.replace(/[^a-zA-Z0-9_]/g, '_');

export function postgresEnv(project) {
  return {
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
    POSTGRES_DB: dbName(project),
  };
}

export const postgresCompose = {
  name: 'postgres',
  service: {
    image: 'postgres:16-alpine',
    restart: 'unless-stopped',
    environment: {
      POSTGRES_USER: '${POSTGRES_USER:-postgres}',
      POSTGRES_PASSWORD: '${POSTGRES_PASSWORD:-postgres}',
      POSTGRES_DB: '${POSTGRES_DB}',
    },
    ports: ['${POSTGRES_PORT:-5432}:5432'],
    volumes: ['postgres_data:/var/lib/postgresql/data'],
    healthcheck: {
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER}'],
      interval: '10s',
      timeout: '3s',
      retries: 5,
    },
  },
  volumes: ['postgres_data'],
};

export const DATABASE_CONFIG = `${layout(true).data}/database.config.ts`;

/** URL de conexión compartida por los ORMs (validada con env si existe). */
export function databaseConfigFile(features) {
  return features.env
    ? { template: 'orm/database.config.env.ts.tpl', to: DATABASE_CONFIG, imports: { envImport: ENV_PROVIDER } }
    : { template: 'orm/database.config.ts.tpl', to: DATABASE_CONFIG };
}

/** Postgres en docker + variables, comunes a todos los ORMs. */
export function ormDatabase(project) {
  return {
    env: {
      ...postgresEnv(project),
      DATABASE_URL: `postgresql://postgres:postgres@localhost:5432/${dbName(project)}`,
    },
    compose: postgresCompose,
  };
}
