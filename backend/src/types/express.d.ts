import type { TokenPayload } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      /** Usuario autenticado, disponible en todas las rutas protegidas. */
      user?: { id: string; email: string };
    }
  }
}

export {};
