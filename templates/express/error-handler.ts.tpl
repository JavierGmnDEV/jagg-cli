import type { ErrorRequestHandler } from 'express';
import { HttpError } from '{{httpErrorImport}}';

/** Errores de cliente que lanza el propio Express (ej. JSON mal formado en el body). */
function clientErrorStatus(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('status' in error)) return null;
  const { status } = error;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}

// Express reconoce el manejador de errores por sus 4 parámetros: no quitar `_next`
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message, details: error.details });
    return;
  }

  const status = clientErrorStatus(error);
  if (status) {
    res.status(status).json({ error: error instanceof Error ? error.message : 'Solicitud inválida' });
    return;
  }

  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
};
