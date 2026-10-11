import { Router } from 'express';
import { metricsConfig } from '{{configImport}}';
import { getMetrics } from '{{providerImport}}';
import { httpMetrics } from '{{middlewareImport}}';
import { metricsHandler } from '{{handlerImport}}';
{{#if loadShedding}}
import { loadSheddingConfig } from '{{loadSheddingConfigImport}}';
import { loadShedding } from '{{loadSheddingImport}}';
{{/if}}

const metrics = getMetrics();

/** Va antes que el resto de middlewares: mide todas las peticiones y expone la ruta que lee Prometheus. */
export const metricsRoutes: Router = Router();

metricsRoutes.use(httpMetrics(metrics, metricsConfig.path));
metricsRoutes.get(metricsConfig.path, metricsHandler(metrics, metricsConfig.token));
{{#if loadShedding}}
// Después de /metrics (Prometheus sigue leyendo en plena sobrecarga) y de la medición (los 503 se ven en Grafana)
metricsRoutes.use(loadShedding({ ...loadSheddingConfig, skip: (req) => req.path === '{{healthPath}}' }));
{{/if}}
