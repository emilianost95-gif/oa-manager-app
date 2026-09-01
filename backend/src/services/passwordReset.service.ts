import crypto from 'node:crypto';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { hashPassword } from '../lib/auth';
import { sendPasswordResetEmail } from '../lib/mailer';
import { badRequest } from '../lib/errors';

/* -------------------------------------------------------------------------- */
/* Tokens                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * El token que viaja en el enlace es aleatorio de 32 bytes (256 bits). En la
 * base de datos sólo guardamos su SHA-256: es de un solo sentido, así que ni
 * con acceso a la tabla se puede reconstruir un enlace válido.
 *
 * SHA-256 (y no bcrypt) es lo correcto acá: el token ya tiene entropía máxima,
 * no es adivinable por fuerza bruta, y necesitamos poder buscarlo por índice.
 */
function generateToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw) };
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function buildResetUrl(rawToken: string): string {
  const base = env.appUrl.replace(/\/+$/, '');
  return `${base}/restablecer?token=${encodeURIComponent(rawToken)}`;
}

/* -------------------------------------------------------------------------- */
/* Límite de solicitudes (en memoria)                                          */
/* -------------------------------------------------------------------------- */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;

const attempts = new Map<string, number[]>();

function tooManyAttempts(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= max) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);

  // Limpieza oportunista para que el mapa no crezca sin control.
  if (attempts.size > 5000) {
    for (const [k, times] of attempts) {
      if (times.every((t) => now - t >= WINDOW_MS)) attempts.delete(k);
    }
  }

  return false;
}

/* -------------------------------------------------------------------------- */
/* Casos de uso                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Crea un token y envía el correo. No devuelve nada y nunca lanza por email
 * inexistente: la respuesta de la API debe ser idéntica exista o no la cuenta,
 * para no permitir enumerar usuarias.
 */
export async function requestPasswordReset(email: string, ip: string | undefined): Promise<void> {
  if (tooManyAttempts(`email:${email}`, MAX_PER_EMAIL)) return;
  if (ip && tooManyAttempts(`ip:${ip}`, MAX_PER_IP)) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // Un enlace nuevo invalida los anteriores: sólo el último sirve.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const { raw, hash } = generateToken();
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { tokenHash: hash, expiresAt, userId: user.id },
  });

  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl: buildResetUrl(raw),
    expiresInMinutes: env.PASSWORD_RESET_TTL_MINUTES,
  });
}

const INVALID_TOKEN_MESSAGE =
  'Este enlace ya no es válido. Puede haber vencido o haberse usado antes. Solicita uno nuevo.';

/** Devuelve el token si sirve; si no, lanza siempre el mismo error. */
async function findUsableToken(rawToken: string) {
  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });

  if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) {
    throw badRequest(INVALID_TOKEN_MESSAGE);
  }

  return token;
}

/** Comprueba el enlace antes de mostrar el formulario. */
export async function verifyPasswordResetToken(rawToken: string): Promise<void> {
  await findUsableToken(rawToken);
}

/**
 * Cambia la contraseña, marca el token como usado y borra el resto de tokens
 * de esa cuenta. Todo en una transacción: o pasa completo, o no pasa.
 */
export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const token = await findUsableToken(rawToken);
  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // La condición `usedAt: null` es la que garantiza el "un solo uso": si dos
    // peticiones llegan a la vez, sólo una marca el token y la otra ve count 0.
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: now },
    });

    if (consumed.count === 0) {
      throw badRequest(INVALID_TOKEN_MESSAGE);
    }

    await tx.user.update({
      where: { id: token.userId },
      data: { passwordHash },
    });

    // El resto de enlaces de esa cuenta dejan de servir.
    await tx.passwordResetToken.deleteMany({
      where: { userId: token.userId, id: { not: token.id } },
    });
  });
}

/** Borra tokens vencidos o ya usados. Se puede llamar desde una tarea programada. */
export async function purgeExpiredTokens(): Promise<number> {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  });
  return count;
}
