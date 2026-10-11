export interface HttpRequestMetric {
  method: string;
  /** Patrón de la ruta (/api/users/:id), nunca la URL real: cada valor distinto crea una serie nueva en Prometheus. */
  route: string;
  statusCode: number;
  durationSeconds: number;
}

export interface UseCaseMetric {
  name: string;
  success: boolean;
  durationSeconds: number;
}

export interface MetricsSnapshot {
  contentType: string;
  body: string;
}

export abstract class MetricsService {
  abstract recordHttpRequest(metric: HttpRequestMetric): void;
  abstract recordUseCase(metric: UseCaseMetric): void;
  abstract snapshot(): Promise<MetricsSnapshot>;
}
