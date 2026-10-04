export class EnvValidationError extends Error {
  constructor(
    readonly key: string,
    readonly reason: string,
  ) {
    super(`Variable de entorno "${key}" inválida: ${reason}`);
    this.name = 'EnvValidationError';
  }
}
