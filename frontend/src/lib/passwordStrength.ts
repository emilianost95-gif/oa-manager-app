/** Largo mínimo, igual que la validación del backend (Zod). */
export const MIN_PASSWORD_LENGTH = 8;

/** Máximo que acepta bcrypt, igual que el backend. */
export const MAX_PASSWORD_LENGTH = 72;

export interface PasswordStrength {
  /** 0 = vacía, 1 = débil, 2 = aceptable, 3 = buena, 4 = fuerte. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Clase de color para la barra. */
  barClass: string;
  textClass: string;
}

const LEVELS: Record<number, Omit<PasswordStrength, 'score'>> = {
  0: { label: '', barClass: 'bg-slate-200', textClass: 'text-slate-400' },
  1: { label: 'Débil', barClass: 'bg-rose-500', textClass: 'text-rose-600' },
  2: { label: 'Aceptable', barClass: 'bg-amber-500', textClass: 'text-amber-600' },
  3: { label: 'Buena', barClass: 'bg-sky-500', textClass: 'text-sky-600' },
  4: { label: 'Fuerte', barClass: 'bg-emerald-500', textClass: 'text-emerald-600' },
};

/**
 * Estimación local y orientativa de la fortaleza, sólo para dar señal visual
 * mientras se escribe. La validación real vive en el backend.
 *
 * No registra ni envía la contraseña a ningún lado.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, ...LEVELS[0] };

  let points = 0;

  if (password.length >= MIN_PASSWORD_LENGTH) points += 1;
  if (password.length >= 12) points += 1;

  const variety =
    Number(/[a-z]/.test(password)) +
    Number(/[A-Z]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^A-Za-z0-9]/.test(password));

  if (variety >= 2) points += 1;
  if (variety >= 3) points += 1;

  // Patrones evidentes: una sola repetición o una secuencia corriente.
  if (/^(.)\1+$/.test(password) || /^(123456|password|contrasena|qwerty)/i.test(password)) {
    points = 1;
  }

  if (password.length < MIN_PASSWORD_LENGTH) points = Math.min(points, 1);

  const score = Math.max(1, Math.min(4, points)) as 1 | 2 | 3 | 4;
  return { score, ...LEVELS[score] };
}
