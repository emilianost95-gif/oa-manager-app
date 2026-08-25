import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';
import { env } from '../config/env';
import { zodIssues } from './validate';

interface PrismaLikeError {
  code?: string;
  meta?: { target?: string[] | string; cause?: string };
}

/** Traduce los códigos de error más comunes de Prisma a mensajes claros. */
function translatePrismaError(err: PrismaLikeError): AppError | null {
  switch (err.code) {
    case 'P2002': {
      const target = Array.isArray(err.meta?.target)
        ? err.meta?.target.join(', ')
        : err.meta?.target;
      return new AppError(
        target
          ? `Ya existe un registro con ese valor (${target}).`
          : 'Ya existe un registro con esos datos.',
        409,
        'DUPLICATE',
      );
    }
    case 'P2003':
      return new AppError(
        'No se pudo completar la operación porque el registro está relacionado con otros datos.',
        409,
        'FOREIGN_KEY',
      );
    case 'P2025':
      return new AppError('No encontramos el registro solicitado.', 404, 'NOT_FOUND');
    case 'P1001':
    case 'P1002':
      return new AppError(
        'No pudimos conectarnos a la base de datos. Intenta nuevamente en unos segundos.',
        503,
        'DB_UNAVAILABLE',
      );
    default:
      return null;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: 'Ruta no encontrada.', code: 'NOT_FOUND' } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // En desarrollo dejamos el detalle técnico completo en consola.
  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        message: 'Revisa los datos ingresados.',
        code: 'VALIDATION_ERROR',
        details: zodIssues(err),
      },
    });
    return;
  }

  const translated = translatePrismaError(err as PrismaLikeError);
  if (translated) {
    res.status(translated.statusCode).json({
      error: { message: translated.message, code: translated.code },
    });
    return;
  }

  if (env.isProduction) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(500).json({
    error: {
      message: 'Ocurrió un problema inesperado. Intenta nuevamente.',
      code: 'INTERNAL_ERROR',
    },
  });
}

/** Envuelve controladores async para que sus errores lleguen al errorHandler. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => unknown>(
  fn: T,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
