import type { RequestHandler } from 'express';
import { HttpError } from '{{httpErrorImport}}';

export const notFound: RequestHandler = (req, _res, next) => {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};
