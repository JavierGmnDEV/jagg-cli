export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static badRequest(message = 'Solicitud inválida', details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = 'No autenticado'): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = 'Sin permisos'): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = 'Recurso no encontrado'): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflicto', details?: unknown): HttpError {
    return new HttpError(409, message, details);
  }
}
