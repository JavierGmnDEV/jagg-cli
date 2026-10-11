import { env } from '{{envImport}}';

export interface MetricsConfig {
  path: string;
  /** Si está definido, /metrics exige `Authorization: Bearer <token>`. */
  token?: string;
}

export const metricsConfig: Readonly<MetricsConfig> = Object.freeze({
  path: env.get('METRICS_PATH').default('{{metricsPath}}').asString(),
{{#if protect}}
  token: env.get('METRICS_TOKEN').required().asString(),
{{else}}
  token: env.get('METRICS_TOKEN').asString(),
{{/if}}
});
