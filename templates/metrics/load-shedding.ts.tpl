import { monitorEventLoopDelay } from 'node:perf_hooks';
import type { Request, RequestHandler } from 'express';

export interface LoadSheddingOptions {
  /** Retraso medio del event loop (ms) a partir del cual se empieza a rechazar: la CPU no da abasto. */
  maxEventLoopDelayMs: number;
  /**
   * Peticiones simultáneas máximas en este proceso (0 = sin límite). Depende de cada app:
   * capacidad × latencia aceptable (p. ej. 3000 req/s × 0,2 s = 600). Mal elegido rechaza de más.
   */
  maxInFlight: number;
  /** Segundos que se sugieren al cliente antes de reintentar (cabecera Retry-After). */
  retryAfterSeconds: number;
  /** Peticiones que nunca se rechazan (p. ej. el health check, para que no reinicien la instancia por estar ocupada). */
  skip?: (req: Request) => boolean;
}

/** Etiqueta de ruta con la que se miden los rechazos (ver http-metrics). */
export const LOAD_SHEDDING_ROUTE = 'load_shedding';

const RESOLUTION_MS = 10;
const INTERVAL_MS = 250;
const STEP = 0.1;
/** Nunca se rechaza todo: si no, la app pasaría el tiempo rechazando y no atendería a nadie. */
const MAX_REJECT_RATIO = 0.9;

/**
 * Load shedding: con la app saturada, responde 503 al instante a una parte de las peticiones en vez de encolarlas.
 * Rechazar cuesta microsegundos, así las aceptadas siguen siendo rápidas y el resto no espera hasta un timeout.
 */
export function loadShedding({
  maxEventLoopDelayMs,
  maxInFlight,
  retryAfterSeconds,
  skip = () => false,
}: LoadSheddingOptions): RequestHandler {
  const delay = monitorEventLoopDelay({ resolution: RESOLUTION_MS });
  delay.enable();

  let rejectRatio = 0;
  let inFlight = 0;

  // La proporción de rechazos sube o baja de a poco según el retraso medido: un interruptor todo/nada oscilaría.
  // Media y no p99: una pausa aislada del GC no debe disparar rechazos. El histograma incluye la resolución del muestreo.
  setInterval(() => {
    const lagMs = Math.max(0, delay.mean / 1e6 - RESOLUTION_MS);
    rejectRatio =
      lagMs > maxEventLoopDelayMs ? Math.min(MAX_REJECT_RATIO, rejectRatio + STEP) : Math.max(0, rejectRatio - STEP);
    delay.reset();
  }, INTERVAL_MS).unref();

  return (req, res, next) => {
    if (skip(req)) return next();

    if ((maxInFlight > 0 && inFlight >= maxInFlight) || Math.random() < rejectRatio) {
      res.locals.metricsRoute = LOAD_SHEDDING_ROUTE;
      res
        .status(503)
        .set('Retry-After', String(retryAfterSeconds))
        .json({ error: 'Servicio saturado, reintenta en unos segundos' });
      return;
    }

    inFlight++;
    let released = false;
    // `close` cubre al cliente que corta antes de la respuesta: sin él, el contador quedaría inflado para siempre
    const release = (): void => {
      if (released) return;
      released = true;
      inFlight--;
    };
    res.once('finish', release);
    res.once('close', release);
    next();
  };
}
