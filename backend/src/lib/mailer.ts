import { env } from '../config/env';

/**
 * -----------------------------------------------------------------------------
 * Punto único de envío de correo.
 * -----------------------------------------------------------------------------
 * El proveedor es Resend, llamado por HTTP. Se eligió así a propósito: Render
 * bloquea los puertos SMTP salientes en el plan gratuito, y una petición HTTPS
 * normal no se topa con esa restricción. Tampoco hace falta instalar nada.
 *
 * Se activa solo cuando existen RESEND_API_KEY y MAIL_FROM. Si faltan:
 *
 *   - En desarrollo: imprime el enlace en la consola del backend, para poder
 *     probar el flujo completo sin servidor de correo.
 *   - En producción: registra una advertencia SIN el enlace (un token impreso
 *     en los logs de Render sería un enlace válido para quien los lea).
 *
 * Para cambiar de proveedor basta con reescribir `deliver()`. El resto de la
 * aplicación no cambia. Ver el README, sección "Recuperación de contraseña".
 * -----------------------------------------------------------------------------
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** ¿Hay un proveedor de correo configurado y listo para enviar? */
export function isMailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.MAIL_FROM);
}

async function deliver(email: OutgoingEmail): Promise<boolean> {
  if (!isMailConfigured()) return false;

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    // Sin esto, una caída del proveedor dejaría la petición colgada y la
    // usuaria esperando en la pantalla de "Enviar enlace".
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    // El cuerpo del error de Resend describe el problema (dominio sin
    // verificar, remitente inválido...) y nunca incluye la API key.
    const detail = await response.text().catch(() => '');
    console.error(`[mailer] Resend respondió ${response.status}. ${detail.slice(0, 300)}`);
    return false;
  }

  return true;
}

export interface PasswordResetEmail {
  to: string;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

/**
 * Envía el correo con el enlace de recuperación.
 *
 * Nunca lanza: un fallo de correo no debe cambiar la respuesta de la API, para
 * no revelar si el email existe o no.
 */
export async function sendPasswordResetEmail(input: PasswordResetEmail): Promise<boolean> {
  const { to, name, resetUrl, expiresInMinutes } = input;

  const subject = 'Restablece tu contraseña — Objetivos de Aprendizaje';

  const text = [
    `Hola ${name},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta.',
    `Abre este enlace para crear una nueva contraseña (vence en ${expiresInMinutes} minutos):`,
    '',
    resetUrl,
    '',
    'Si no fuiste tú, puedes ignorar este correo: tu contraseña no cambiará.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1e293b;line-height:1.6">
      <p>Hola ${escapeHtml(name)},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p style="margin:28px 0">
        <a href="${escapeHtml(resetUrl)}"
           style="background:#2563eb;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:600;display:inline-block">
          Crear nueva contraseña
        </a>
      </p>
      <p style="color:#64748b;font-size:14px">
        El enlace vence en ${expiresInMinutes} minutos y sólo puede usarse una vez.
      </p>
      <p style="color:#64748b;font-size:14px">
        Si no fuiste tú, puedes ignorar este correo: tu contraseña no cambiará.
      </p>
    </div>
  `.trim();

  try {
    const sent = await deliver({ to, subject, text, html });
    if (sent) return true;
  } catch (error) {
    console.error('[mailer] Falló el envío del correo de recuperación.', error);
  }

  // Por qué no salió: distinguir "no está configurado" de "está configurado y
  // falló" es lo que permite diagnosticar el problema desde los logs.
  if (isMailConfigured()) {
    console.error('[mailer] El proveedor no aceptó el envío del enlace de recuperación.');
  } else if (env.isProduction) {
    console.warn(
      '[mailer] No hay proveedor de correo configurado: no se envió el enlace de recuperación.',
    );
  }

  // El enlace sólo se imprime fuera de producción: un token en los logs de
  // Render equivale a una contraseña para quien pueda leerlos.
  if (!env.isProduction) {
    console.info(
      `\n[mailer] Enlace de recuperación para ${to} (no salió por correo):\n  ${resetUrl}\n  (vence en ${expiresInMinutes} minutos)\n`,
    );
  }

  return false;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
