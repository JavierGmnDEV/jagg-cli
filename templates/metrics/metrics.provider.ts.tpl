import type { MetricsService } from '{{contractImport}}';
import { PrometheusMetricsService } from '{{implImport}}';

export function getMetrics(): MetricsService {
  return PrometheusMetricsService.getInstance();
}
