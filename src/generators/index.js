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

export const generators = [clean, express, env, redis, postgres, prisma, drizzle, entity, repository, usecase];
