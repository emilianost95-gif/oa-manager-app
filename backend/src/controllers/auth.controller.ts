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
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
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
