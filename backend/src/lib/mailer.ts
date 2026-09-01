import { env } from '../config/env';

/**
 * -----------------------------------------------------------------------------
 * Punto único de envío de correo.
 * -----------------------------------------------------------------------------
 * Hoy OA Manager NO tiene proveedor de correo configurado. Para no fingir un
 * envío que no ocurre, este módulo se comporta así:
 *
 *   - En desarrollo: imprime el enlace en la consola del backend, para poder
 *     probar el flujo completo de extremo a extremo sin servidor de correo.
 *   - En producción: registra una advertencia SIN el enlace (un token impreso
 *     en los logs de Render sería un enlace válido para quien los lea) y
 *     devuelve `false`.
 *
 * PARA HACERLO REAL sólo hay que reemplazar el cuerpo de `deliver()` por una
 * llamada al proveedor. El resto de la aplicación no cambia. Ver el README,
 * sección "Recuperación de contraseña".
 * -----------------------------------------------------------------------------
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** ¿Hay un proveedor de correo configurado? Hoy: no. */
export function isMailConfigured(): boolean {
  return false;
}

async function deliver(email: OutgoingEmail): Promise<boolean> {
  // TODO: conectar aquí el proveedor de correo (Resend, SMTP, SES...).
  //
  // Ejemplo con Resend, sin dependencias extra:
  //
  //   const response = await fetch('https://api.resend.com/emails', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       from: 'OA Manager <no-reply@tu-dominio.cl>',
  //       to: email.to,
  //       subject: email.subject,
  //       text: email.text,
  //       html: email.html,
  //     }),
  //   });
  //   return response.ok;

  void email;
  return false;
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

  if (env.isProduction) {
    // Sin enlace: un token en los logs equivale a una contraseña.
    console.warn(
      '[mailer] No hay proveedor de correo configurado: no se envió el enlace de recuperación.',
    );
  } else {
    console.info(
      `\n[mailer] Sin proveedor de correo configurado. Enlace de recuperación para ${to}:\n  ${resetUrl}\n  (vence en ${expiresInMinutes} minutos)\n`,
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
