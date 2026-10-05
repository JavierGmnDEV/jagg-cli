import { layout } from './layout.js';
import { dbName, ENV_PROVIDER, requireClean } from './shared.js';

const DIR = `${layout(true).data}/mongoose`;
const CONFIG = `${DIR}/mongo.config.ts`;
export const MONGOOSE_CLIENT = `${DIR}/mongoose.client.ts`;
export const MONGOOSE_USER_MODEL = `${DIR}/models/user.model.ts`;

export const mongooseUserModel = { template: 'mongoose/user.model.ts.tpl', to: MONGOOSE_USER_MODEL };

const mongoCompose = {
  name: 'mongo',
  service: {
    image: 'mongo:7',
    restart: 'unless-stopped',
    environment: {
      MONGO_INITDB_ROOT_USERNAME: '${MONGO_USER:-mongo}',
      MONGO_INITDB_ROOT_PASSWORD: '${MONGO_PASSWORD:-mongo}',
    },
    ports: ['${MONGO_PORT:-27017}:27017'],
    volumes: ['mongo_data:/data/db'],
    healthcheck: {
      test: ['CMD', 'mongosh', '--quiet', '--eval', "db.adminCommand('ping')"],
      interval: '10s',
      timeout: '5s',
      retries: 5,
    },
  },
  volumes: ['mongo_data'],
};

export const mongoose = {
  name: 'mongoose',
  usage: 'mongoose',
  description: 'ODM Mongoose: conexión singleton, modelo User y MongoDB en docker (requiere clean)',
  requiresName: false,
  plan: ({ features, project }) => {
    requireClean(features, 'g mongoose');
    return {
      files: [
        features.env
          ? { template: 'mongoose/mongo.config.env.ts.tpl', to: CONFIG, imports: { envImport: ENV_PROVIDER } }
          : { template: 'mongoose/mongo.config.ts.tpl', to: CONFIG },
        { template: 'mongoose/mongoose.client.ts.tpl', to: MONGOOSE_CLIENT, imports: { configImport: CONFIG } },
        mongooseUserModel,
      ],
      dependencies: ['mongoose@^9'],
      env: {
        MONGO_USER: 'mongo',
        MONGO_PASSWORD: 'mongo',
        MONGO_PORT: '27017',
        MONGO_URL: `mongodb://mongo:mongo@localhost:27017/${dbName(project)}?authSource=admin`,
      },
      compose: mongoCompose,
      notes: [
        'Siguientes pasos:\n' +
          '  docker compose up -d mongo\n' +
          'Mongo no necesita migraciones: la colección y el índice único de email se crean al usarse.',
      ],
    };
  },
};
