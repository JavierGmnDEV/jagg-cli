import { env } from '{{providerImport}}';

export const appConfig = Object.freeze({
  nodeEnv: env.get('NODE_ENV').default('development').asEnum(['development', 'test', 'production']),
  port: env.get('PORT').default('3000').asPort(),
});
