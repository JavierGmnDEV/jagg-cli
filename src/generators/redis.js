import { layout } from './layout.js';
import { ENV_PROVIDER, ENV_TIP } from './shared.js';

const REDIS = '{{srcDir}}/infrastructure/redis';
const CLIENT = `${REDIS}/redis.client.ts`;

function servicePaths(clean) {
  if (clean) {
    const { serviceContracts, services } = layout(true);
    return {
      contract: `${serviceContracts}/cache.service.ts`,
      impl: `${services}/redis-cache.service.ts`,
      provider: `${services}/cache.provider.ts`,
      vars: { cacheContract: 'CacheService', cacheImpl: 'RedisCacheService' },
    };
  }
  return {
    contract: '{{srcDir}}/domain/redis/cache.port.ts',
    impl: `${REDIS}/redis-cache.adapter.ts`,
    provider: `${REDIS}/cache.provider.ts`,
    vars: { cacheContract: 'CachePort', cacheImpl: 'RedisCacheAdapter' },
  };
}

/** Contrato de cache + implementación sobre el singleton + provider. */
export function redisServiceFiles(clean) {
  const { contract, impl, provider, vars } = servicePaths(clean);
  return [
    { template: 'redis/cache.contract.ts.tpl', to: contract, vars },
    {
      template: 'redis/redis-cache.impl.ts.tpl',
      to: impl,
      vars,
      imports: { contractImport: contract, clientImport: CLIENT },
    },
    {
      template: 'redis/cache.provider.ts.tpl',
      to: provider,
      vars,
      imports: { contractImport: contract, implImport: impl },
    },
  ];
}

export const redis = {
  name: 'redis',
  usage: 'redis',
  description: 'cache Redis: contrato de dominio, servicio, cliente singleton y servicio docker',
  requiresName: false,
  plan: ({ features }) => {
    const config = `${REDIS}/redis.config.ts`;
    return {
      files: [
        {
          template: features.env ? 'redis/redis.config.env.ts.tpl' : 'redis/redis.config.ts.tpl',
          to: config,
          imports: features.env ? { envImport: ENV_PROVIDER } : {},
        },
        { template: 'redis/redis.client.ts.tpl', to: CLIENT, imports: { configImport: config } },
        ...redisServiceFiles(features.clean),
      ],
      dependencies: ['ioredis'],
      env: {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_PASSWORD: '',
        REDIS_DB: '0',
        REDIS_KEY_PREFIX: '',
      },
      compose: {
        name: 'redis',
        service: {
          image: 'redis:7-alpine',
          restart: 'unless-stopped',
          command: ['redis-server', '--appendonly', 'yes'],
          ports: ['${REDIS_PORT:-6379}:6379'],
          volumes: ['redis_data:/data'],
          healthcheck: {
            test: ['CMD', 'redis-cli', 'ping'],
            interval: '10s',
            timeout: '3s',
            retries: 5,
          },
        },
        volumes: ['redis_data'],
      },
      notes: [
        `Uso: import { getCache } from '${servicePaths(features.clean).provider.replace(/\.ts$/, '')}';`,
        ...(features.env ? [] : [ENV_TIP]),
      ],
    };
  },
};
