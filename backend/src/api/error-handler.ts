import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { OrderNotFoundError } from '../application/errors.js';
import { DomainError } from '../domain/errors.js';

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

/**
 * Política de códigos (marco teórico del proyecto):
 *   400: petición mal formada (JSON inválido, campo ausente o de tipo incorrecto).
 *   422: petición bien formada que incumple una regla de negocio (peso ≤ 0 o > 20 kg,
 *        más de 2 decimales, tipo de cliente o de envío desconocido), con el campo y el motivo.
 */
export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    res.status(400).json(errorBody('VALIDATION_ERROR', 'La petición contiene datos inválidos.', details));
    return;
  }

  if (err instanceof DomainError) {
    res.status(422).json(errorBody(err.code, err.message, [{ field: err.field, message: err.message }]));
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
