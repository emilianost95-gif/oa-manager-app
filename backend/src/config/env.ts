import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatorio'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  /** Minutos que dura un enlace de recuperación de contraseña. */
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().max(1440).default(60),
  /**
   * URL pública del frontend, usada para construir el enlace de recuperación.
   * Si no se define se usa el primer origen de FRONTEND_URL.
   */
  PUBLIC_APP_URL: z.string().optional(),

  /**
   * Proveedor de correo (Resend). Si falta cualquiera de las dos, no se envía
   * nada: en desarrollo el enlace se imprime en la consola.
   */
  RESEND_API_KEY: z.string().optional(),
  /** Remitente verificado, por ejemplo: "OA Manager <no-reply@tu-dominio.cl>". */
  MAIL_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n[config] Variables de entorno inválidas:\n${details}\n`);
  console.error('Revisa tu archivo backend/.env (puedes copiar .env.example).\n');
  process.exit(1);
}

const raw = parsed.data;

const allowedOrigins = raw.FRONTEND_URL.split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Configurar sólo una de las dos es casi siempre un olvido, y el síntoma
// (correos que nunca llegan) es difícil de diagnosticar. Mejor avisar al
// arrancar.
if (Boolean(raw.RESEND_API_KEY) !== Boolean(raw.MAIL_FROM)) {
  console.warn(
    '[config] RESEND_API_KEY y MAIL_FROM deben definirse juntas. ' +
      'Falta una de las dos, así que el envío de correo queda desactivado.',
  );
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  /** Lista de orígenes permitidos por CORS. */
  allowedOrigins,
  /** Base para los enlaces que se envían por correo. */
  appUrl: raw.PUBLIC_APP_URL?.trim() || allowedOrigins[0] || 'http://localhost:5173',
};

export type Env = typeof env;
