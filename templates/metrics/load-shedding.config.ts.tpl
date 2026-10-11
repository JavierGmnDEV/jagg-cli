export interface LoadSheddingConfig {
  maxEventLoopDelayMs: number;
  maxInFlight: number;
  retryAfterSeconds: number;
}

export const loadSheddingConfig: Readonly<LoadSheddingConfig> = Object.freeze({
  maxEventLoopDelayMs: Number(process.env.LOAD_SHEDDING_MAX_EVENT_LOOP_DELAY_MS ?? 50),
  maxInFlight: Number(process.env.LOAD_SHEDDING_MAX_IN_FLIGHT ?? 0),
  retryAfterSeconds: Number(process.env.LOAD_SHEDDING_RETRY_AFTER_SECONDS ?? 1),
});
