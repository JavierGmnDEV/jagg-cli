import { Router } from 'express';
import { metricsConfig } from '{{configImport}}';
import { getMetrics } from '{{providerImport}}';
import { httpMetrics } from '{{middlewareImport}}';
import { metricsHandler } from '{{handlerImport}}';

const metrics = getMetrics();

/** Va antes que el resto de middlewares: mide todas las peticiones y expone la ruta que lee Prometheus. */
export const metricsRoutes: Router = Router();

metricsRoutes.use(httpMetrics(metrics, metricsConfig.path));
metricsRoutes.get(metricsConfig.path, metricsHandler(metrics, metricsConfig.token));
