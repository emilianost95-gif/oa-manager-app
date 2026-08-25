import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE, verifyToken } from '../lib/auth';
import { unauthorized } from '../lib/errors';

/**
 * Extrae el token de la cookie httpOnly o de la cabecera Authorization
 * (útil para pruebas con curl / Postman).
 */
function extractToken(req: Request): string | null {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.[AUTH_COOKIE];
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(unauthorized());
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(unauthorized('Tu sesión expiró. Vuelve a iniciar sesión.'));
  }
}

/** Devuelve el id del usuario autenticado o lanza 401. */
export function currentUserId(req: Request): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}
