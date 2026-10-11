import { Counter, Histogram, Registry, collectDefaultMetrics } from '@prometheus-io/client';
import type { HttpRequestMetric, MetricsService, MetricsSnapshot, UseCaseMetric } from '{{contractImport}}';

const HTTP_LABELS = ['method', 'route', 'status_code'] as const;

/**
 * Singleton + Adapter: la única instancia del cliente de Prometheus en la app; el resto solo conoce MetricsService.
 * Usa su propio Registry: registrar dos veces la misma métrica en el registro global lanza error.
 */
export class PrometheusMetricsService implements MetricsService {
  private static instance: PrometheusMetricsService | null = null;

  private readonly registry = new Registry();

  private readonly httpRequests = new Counter({
    name: 'http_requests_total',
    help: 'Peticiones HTTP atendidas',
    labelNames: HTTP_LABELS,
    registers: [this.registry],
  });

  private readonly httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de las peticiones HTTP en segundos',
    labelNames: HTTP_LABELS,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  private readonly useCaseDuration = new Histogram({
    name: 'use_case_duration_seconds',
    help: 'Duración de los casos de uso en segundos (outcome: success | error)',
    labelNames: ['use_case', 'outcome'] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [this.registry],
  });

  private constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  static getInstance(): PrometheusMetricsService {
    PrometheusMetricsService.instance ??= new PrometheusMetricsService();
    return PrometheusMetricsService.instance;
  }

  recordHttpRequest({ method, route, statusCode, durationSeconds }: HttpRequestMetric): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.httpRequests.inc(labels);
    this.httpDuration.observe(labels, durationSeconds);
  }

  recordUseCase({ name, success, durationSeconds }: UseCaseMetric): void {
    this.useCaseDuration.observe({ use_case: name, outcome: success ? 'success' : 'error' }, durationSeconds);
  }

  async snapshot(): Promise<MetricsSnapshot> {
    return { contentType: this.registry.contentType, body: await this.registry.metrics() };
  }
}
