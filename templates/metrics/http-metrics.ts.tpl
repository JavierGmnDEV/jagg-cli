import type { Request, RequestHandler } from 'express';
import type { MetricsService } from '{{contractImport}}';

/**
 * Patrón de la ruta que atendió la petición (/api/users/:id); las inexistentes se agrupan en "unmatched"
 * para no crear una serie por URL. Se captura cuando Express asigna req.route: al propagar un error
 * (p. ej. un 404 lanzado por un caso de uso) Express ya restauró req.baseUrl y el prefijo se perdería.
 */
function trackRoute(req: Request): () => string {
  let pattern = 'unmatched';
  let route: unknown;
  Object.defineProperty(req, 'route', {
    configurable: true,
    enumerable: true,
    get: () => route,
    set: (value: { path?: unknown } | undefined) => {
      route = value;
      if (value) pattern = `${req.baseUrl}${value.path === '/' ? '' : String(value.path)}` || '/';
    },
  });
  return () => pattern;
}

/** Mide cada petición (cantidad, duración y código de respuesta), excepto la propia ruta de métricas. */
export function httpMetrics(metrics: MetricsService, metricsPath: string): RequestHandler {
  return (req, res, next) => {
    if (req.path === metricsPath) return next();

    const start = performance.now();
    const routePattern = trackRoute(req);
    res.on('finish', () => {
      metrics.recordHttpRequest({
        method: req.method,
        route: routePattern(),
        statusCode: res.statusCode,
        durationSeconds: (performance.now() - start) / 1000,
      });
    });
    next();
  };
}
