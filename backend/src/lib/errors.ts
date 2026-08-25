/**
 * Errores de dominio. El middleware de errores los traduce a respuestas HTTP
 * con mensajes en español, aptos para mostrar directamente a la usuaria.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(msg, 400, 'BAD_REQUEST', details);

export const unauthorized = (msg = 'Necesitas iniciar sesión para continuar.') =>
  new AppError(msg, 401, 'UNAUTHORIZED');

export const forbidden = (msg = 'No tienes permiso para acceder a este recurso.') =>
  new AppError(msg, 403, 'FORBIDDEN');

export const notFound = (msg = 'No encontramos lo que estabas buscando.') =>
  new AppError(msg, 404, 'NOT_FOUND');

export const conflict = (msg: string) => new AppError(msg, 409, 'CONFLICT');
