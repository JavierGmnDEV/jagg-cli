import { CLEAN_FOLDERS } from './layout.js';
import { redisServiceFiles } from './redis.js';

export const clean = {
  name: 'clean',
  usage: 'clean',
  description: 'estructura de carpetas Clean Architecture (domain/api, infrastructure/api, data, presentation)',
  requiresName: false,
  plan: ({ features }) => ({
    files: [
      ...CLEAN_FOLDERS.map((dir) => ({ content: '', to: `{{srcDir}}/${dir}/.gitkeep` })),
      ...(features.redis ? redisServiceFiles(true) : []),
    ],
    notes: [
      'Los demás generadores (env, redis, postgres, prisma, drizzle, entity, repository, usecase) usarán esta estructura.',
      ...(features.redisLegacy
        ? [
            'Redis ya existía con la estructura anterior: domain/redis/ y los archivos\n' +
              'redis-cache.adapter.ts y cache.provider.ts de infrastructure/redis/ quedaron duplicados.',
          ]
        : []),
    ],
  }),
};
