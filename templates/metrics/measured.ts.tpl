import type { MetricsService } from '{{contractImport}}';

type UseCase = { execute(...args: never[]): Promise<unknown> };

/**
 * Decorator: mide duración y fallos de un caso de uso sin modificarlo.
 * Devuelve el mismo tipo que recibe, así quien lo consume (el controlador) no cambia.
 */
export function measured<T extends UseCase>(useCase: T, metrics: MetricsService, name: string): T {
  const execute = async (...args: unknown[]): Promise<unknown> => {
    const start = performance.now();
    let success = false;
    try {
      const result = await (useCase.execute as (...input: unknown[]) => Promise<unknown>).apply(useCase, args);
      success = true;
      return result;
    } finally {
      metrics.recordUseCase({ name, success, durationSeconds: (performance.now() - start) / 1000 });
    }
  };
  return Object.assign(Object.create(useCase) as T, { execute });
}
