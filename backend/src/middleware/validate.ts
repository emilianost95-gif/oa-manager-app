import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { AppError } from '../lib/errors';

type Target = 'body' | 'query' | 'params';

export interface FieldIssue {
  field: string;
  message: string;
}

export function zodIssues(error: ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(general)',
    message: issue.message,
  }));
}

/**
 * Valida y NORMALIZA la parte indicada de la request usando un esquema Zod.
 * El resultado parseado reemplaza al original, por lo que los controladores
 * siempre trabajan con datos ya tipados y saneados.
 */
export function validate(schema: ZodTypeAny, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      next(
        new AppError(
          'Revisa los datos ingresados.',
          422,
          'VALIDATION_ERROR',
          zodIssues(result.error),
        ),
      );
      return;
    }

    if (target === 'query') {
      // req.query es de sólo lectura en Express 5; guardamos aparte.
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[target] = result.data as never;
    }
    next();
  };
}

/** Acceso tipado al resultado de `validate(schema, 'query')`. */
export function validatedQuery<T>(req: Request): T {
  return (req as Request & { validatedQuery?: T }).validatedQuery as T;
}
