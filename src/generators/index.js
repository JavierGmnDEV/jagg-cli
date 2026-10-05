import { clean } from './clean.js';
import { express } from './express.js';
import { env } from './env.js';
import { redis } from './redis.js';
import { postgres } from './postgres.js';
import { prisma } from './prisma.js';
import { drizzle } from './drizzle.js';
import { entity } from './entity.js';
import { repository } from './repository.js';
import { usecase } from './usecase.js';
import { typeorm } from './typeorm.js';
import { sequelize } from './sequelize.js';
import { mongoose } from './mongoose.js';
import { userCrud } from './user-crud.js';
import { datasource } from './datasource.js';

export const generators = [
  clean,
  express,
  env,
  redis,
  postgres,
  prisma,
  drizzle,
  typeorm,
  sequelize,
  mongoose,
  entity,
  repository,
  usecase,
  userCrud,
  datasource,
];
