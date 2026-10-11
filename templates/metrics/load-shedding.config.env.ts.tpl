import { env } from '{{envImport}}';

export interface LoadSheddingConfig {
  maxEventLoopDelayMs: number;
  maxInFlight: number;
  retryAfterSeconds: number;
}

export const loadSheddingConfig: Readonly<LoadSheddingConfig> = Object.freeze({
  maxEventLoopDelayMs: env.get('LOAD_SHEDDING_MAX_EVENT_LOOP_DELAY_MS').default('50').asInt(),
  maxInFlight: env.get('LOAD_SHEDDING_MAX_IN_FLIGHT').default('0').asInt(),
  retryAfterSeconds: env.get('LOAD_SHEDDING_RETRY_AFTER_SECONDS').default('1').asInt(),
});
