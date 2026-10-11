import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { MetricsService } from '{{contractImport}}';

/** Expone las métricas en el formato de Prometheus; con token, solo para quien envíe `Authorization: Bearer <token>`. */
export function metricsHandler(metrics: MetricsService, token?: string): RequestHandler {
  const expected = token ? Buffer.from(`Bearer ${token}`) : null;

  return async (req, res) => {
    if (expected) {
      const received = Buffer.from(req.get('authorization') ?? '');
      // timingSafeEqual exige el mismo largo y evita revelar el token por el tiempo de respuesta
      if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
        res.status(401).set('WWW-Authenticate', 'Bearer').end();
        return;
      }
    }
    const { contentType, body } = await metrics.snapshot();
    res.set('Content-Type', contentType).send(body);
  };
}
