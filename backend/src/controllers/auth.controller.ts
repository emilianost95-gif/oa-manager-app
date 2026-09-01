import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  clearAuthCookie,
  hashPassword,
  setAuthCookie,
  signToken,
  verifyPassword,
} from '../lib/auth';
import { conflict, unauthorized, notFound, badRequest } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import {
  requestPasswordReset,
  resetPassword as resetPasswordUseCase,
  verifyPasswordResetToken,
} from '../services/passwordReset.service';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
  VerifyResetTokenInput,
} from '../schemas/auth.schema';

const publicUser = (u: { id: string; name: string; email: string; createdAt: Date }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  createdAt: u.createdAt,
});

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw conflict('Ya existe una cuenta registrada con ese email.');
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });

  const token = signToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);

  res.status(201).json({ user: publicUser(user), token });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw unauthorized('Email o contraseña incorrectos.');
  }

  const token = signToken({ sub: user.id, email: user.email });
  setAuthCookie(res, token);

  res.json({ user: publicUser(user), token });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookie(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: currentUserId(req) } });
  if (!user) throw unauthorized();
  res.json({ user: publicUser(user) });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { name } = req.body as UpdateProfileInput;
  const user = await prisma.user.update({
    where: { id: currentUserId(req) },
    data: { name },
  });
  res.json({ user: publicUser(user) });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  const userId = currentUserId(req);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('No encontramos tu cuenta.');

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw badRequest('La contraseña actual no es correcta.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  res.json({ ok: true });
}

/* -------------------------------------------------------------------------- */
/* Recuperación de contraseña                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Solicita el enlace de recuperación.
 *
 * Responde SIEMPRE lo mismo, exista o no la cuenta y se haya podido enviar el
 * correo o no. Cualquier diferencia (mensaje, código o tiempo de respuesta)
 * permitiría averiguar qué emails están registrados.
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as ForgotPasswordInput;

  await requestPasswordReset(email, req.ip);

  res.json({
    ok: true,
    message:
      'Si existe una cuenta asociada a este correo, recibirás un enlace para restablecer tu contraseña.',
  });
}

/** Comprueba que el enlace siga sirviendo, antes de mostrar el formulario. */
export async function verifyResetToken(req: Request, res: Response): Promise<void> {
  const { token } = req.body as VerifyResetTokenInput;
  await verifyPasswordResetToken(token);
  res.json({ valid: true });
}

/** Cambia la contraseña usando el token del enlace. */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as ResetPasswordInput;

  await resetPasswordUseCase(token, password);

  // La sesión de este navegador (si la había) queda cerrada: la usuaria debe
  // entrar de nuevo con la contraseña recién creada.
  clearAuthCookie(res);

  res.json({ ok: true });
}
