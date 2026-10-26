import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { OrderNotFoundError } from '../application/errors.js';
import { DomainError, InvalidWeightError } from '../domain/errors.js';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

const errorBody = (code: string, message: string, details?: ApiErrorBody['error']['details']): ApiErrorBody => ({
  error: details ? { code, message, details } : { code, message },
});

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(errorBody('NOT_FOUND', `Ruta no encontrada: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    res.status(400).json(errorBody('VALIDATION_ERROR', 'La petición contiene datos inválidos.', details));
    return;
  }

  if (err instanceof InvalidWeightError) {
    res
      .status(400)
      .json(errorBody(err.code, err.message, [{ field: 'weightKg', message: err.message }]));
    return;
  }

  if (err instanceof DomainError) {
    // Regla de negocio incumplida con datos bien formados (p. ej. peso por encima del límite).
    res.status(422).json(errorBody(err.code, err.message));
    return;
  }

  if (err instanceof OrderNotFoundError) {
    res.status(404).json(errorBody(err.code, err.message));
    return;
  }

  if (isClientError(err)) {
    const message =
      err.type === 'entity.parse.failed' ? 'El cuerpo de la petición no es un JSON válido.' : err.message;
    res.status(err.status).json(errorBody('BAD_REQUEST', message));
    return;
  }

  console.error(err);
  res.status(500).json(errorBody('INTERNAL_ERROR', 'Ha ocurrido un error inesperado.'));
};

/** Errores 4xx que lanza el propio Express (JSON mal formado, cuerpo demasiado grande...). */
function isClientError(err: unknown): err is { status: number; type?: string; message: string } {
  if (typeof err !== 'object' || err === null || !('status' in err)) {
    return false;
  }
  const { status } = err as { status: unknown };
  return typeof status === 'number' && status >= 400 && status < 500;
}
