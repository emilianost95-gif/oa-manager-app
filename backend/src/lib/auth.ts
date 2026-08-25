import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE = 'oa_token';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface TokenPayload {
  sub: string;
  email: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'strict' : 'lax',
  secure: env.isProduction,
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
};

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, cookieOptions);
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...cookieOptions, maxAge: undefined });
}
