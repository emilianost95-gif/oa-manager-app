import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre es demasiado largo.'),
  email: z
    .string({ required_error: 'El email es obligatorio.' })
    .trim()
    .toLowerCase()
    .email('Ingresa un email válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña no puede superar los 72 caracteres.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un email válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual.'),
  newPassword: z
    .string()
    .min(8, 'La nueva contraseña debe tener al menos 8 caracteres.')
    .max(72, 'La contraseña no puede superar los 72 caracteres.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
