export interface MetricsConfig {
  path: string;
  /** Si está definido, /metrics exige `Authorization: Bearer <token>`. */
  token?: string;
}

{{#if protect}}
const token = process.env.METRICS_TOKEN;
if (!token) throw new Error('Falta METRICS_TOKEN: la ruta de métricas está protegida');

{{/if}}
export const metricsConfig: Readonly<MetricsConfig> = Object.freeze({
  path: process.env.METRICS_PATH ?? '{{metricsPath}}',
{{#if protect}}
  token,
{{else}}
  token: process.env.METRICS_TOKEN || undefined,
{{/if}}
});
